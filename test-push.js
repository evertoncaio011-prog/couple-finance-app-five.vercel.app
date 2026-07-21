// Script de teste isolado pra descobrir por que o push não chega.
// Roda direto no seu computador (não precisa do app rodando).
//
// COMO USAR:
// 1. npm install web-push   (dentro da pasta do projeto, ou em qualquer pasta)
// 2. Preencha as 4 constantes abaixo com valores reais
// 3. node test-push.js
//
// O que ele faz: manda UM push de teste direto pro navegador inscrito,
// sem passar pelo Supabase nem pelo Next.js — só isola se VAPID + endpoint
// funcionam juntos. O erro (se houver) aparece explícito no terminal.

const webpush = require('web-push')

// 1) Cole aqui as MESMAS chaves que estão no Vercel agora:
const VAPID_PUBLIC_KEY = 'BLa-l3b5ppmoF6pvW9vykpNiLaoQZo8a91540XyLhkwMp9v68AdF43mnPCmdSd06MGLdbrEUg2vYlFEKOeD0Lgw'
const VAPID_PRIVATE_KEY = 'kIdYDi6L_jI-Zy0ef6g7iEib_M4UVo-2enwAOTyOcWg'
const VAPID_SUBJECT = 'mailto:seuemail@exemplo.com' // ou o que você configurou

// 2) Cole aqui os dados de UMA linha da tabela push_subscriptions no Supabase
//    (pegue endpoint, p256dh e auth de qualquer linha do seu parceiro, por exemplo)
const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/e2n6cWEXELo:APA91bE926q5CvWk0USGyIF8LCrMDZ6d39avv5iBzf8NgI4Nz5hClQpwhjtT0IvagXrkUbRfaXH0Uf9PnQJGZAbndHzaoDrtFvtilwzPLdsaNuJ7VTxkmh_F5nQ3mYgYevoPJ7UpoN6s',
  keys: {
    p256dh: 'BDxnaWSBmh6X8l6JTD85EZPL-02LnVybG-Mm-3sdy38-eXOUkI_h9NS7FT6WLlOHSWN9EkE0Lb4UDEGvfi4uJm0',
    auth: 'DA_ALLEZHwvL17G4emNeEQ',
  },
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

webpush
  .sendNotification(
    subscription,
    JSON.stringify({ title: 'Teste manual', body: 'Se isso chegou, as chaves batem certinho!' }),
  )
  .then(() => {
    console.log('✅ SUCESSO — o push foi aceito pelo serviço (Google/FCM). Deve aparecer no aparelho em segundos.')
  })
  .catch((err) => {
    console.error('❌ FALHOU. Detalhes do erro abaixo — me manda essa saída inteira:')
    console.error('statusCode:', err.statusCode)
    console.error('body:', err.body)
    console.error('headers:', err.headers)
    console.error(err)
  })
