import { createClient } from "@/lib/supabase/server";
import { sendPushToAccount } from "@/lib/push";

export async function createNotification({
  accountId,
  userId,
  type,
  title,
  message,
}: {
  accountId: string;
  userId?: string | null;
  type: string;
  title: string;
  message: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    account_id: accountId,
    user_id: userId,
    type,
    title,
    message,
  });

  if (error) {
    console.error("🚨 ERRO AO SALVAR NOTIFICAÇÃO:", error.message);
    return;
  }

  console.log("✅ Notificação salva com sucesso no Supabase!");

  // Isso aqui é o que realmente manda a notificação pro celular/navegador
  // do outro membro — salvar na tabela acima é só o registro histórico.
  await sendPushToAccount({
    accountId,
    excludeUserId: userId,
    payload: { title, body: message },
  });
}