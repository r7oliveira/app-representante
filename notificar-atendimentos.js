// Roda a cada 10-15 min via GitHub Actions.
// Checa a agenda de cada representante e manda notificação push
// 1 hora antes de cada atendimento com consultora.

const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const DIAS_AGENDA = [
  { key: 'segunda', offset: 1 },
  { key: 'terca', offset: 2 },
  { key: 'quarta', offset: 3 },
  { key: 'quinta', offset: 4 },
  { key: 'sexta', offset: 5 },
  { key: 'sabado', offset: 6 },
  { key: 'domingo', offset: 0 },
];

// Mesmo cálculo do app: início da semana = domingo mais recente, à meia-noite.
function inicioSemanaAtual() {
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = domingo
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - diaSemana);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function diaKeyParaData(diaKey) {
  const info = DIAS_AGENDA.find(d => d.key === diaKey);
  const inicio = inicioSemanaAtual();
  const data = new Date(inicio);
  data.setDate(inicio.getDate() + info.offset);
  return data;
}

function horarioParaData(diaKey, horario) {
  const data = diaKeyParaData(diaKey);
  const m = /^(\d{1,2}):(\d{2})/.exec(horario || '');
  if (!m) return null;
  data.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
  return data;
}

async function main() {
  const agora = new Date();
  const janelaInicio = new Date(agora.getTime() + 55 * 60 * 1000);
  const janelaFim = new Date(agora.getTime() + 70 * 60 * 1000);

  const snap = await db.collection('representantes').get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const agenda = data.agenda || {};
    const tokens = data.fcmTokens || [];
    if (!tokens.length) continue;

    let mudou = false;

    for (const diaInfo of DIAS_AGENDA) {
      const lista = agenda[diaInfo.key] || [];
      for (const t of lista) {
        if (!t.consultoraId || !t.horario || t.notificado1h) continue;
        const dataHora = horarioParaData(diaInfo.key, t.horario);
        if (!dataHora) continue;
        if (dataHora >= janelaInicio && dataHora <= janelaFim) {
          console.log(`Notificando ${doc.id}: ${t.texto} às ${t.horario}`);
          const mensagem = {
            notification: {
              title: 'Atendimento em 1 hora',
              body: `${t.texto} às ${t.horario}`,
            },
            tokens,
          };
          try {
            await admin.messaging().sendEachForMulticast(mensagem);
          } catch (e) {
            console.error('Erro ao enviar notificação:', e.message);
          }
          t.notificado1h = true;
          mudou = true;
        }
      }
    }

    if (mudou) {
      await db.collection('representantes').doc(doc.id).update({ agenda });
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
