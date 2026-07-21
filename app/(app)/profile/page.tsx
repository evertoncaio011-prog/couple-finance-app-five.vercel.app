import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { requireAccount, getMembers, getMyAccounts } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { PasswordForm, ProfileForm } from '@/components/profile-form'
import { InviteCard } from '@/components/invite-card'
import { JoinCodeForm } from '@/components/join-code-form'
import { AccountSwitcher } from '@/components/account-switcher'
import { LeaveAccountPermanentlyButton } from '@/components/leave-account-permanently-button'
import { RemovePartnerButton } from '@/components/remove-partner-button'
import { SignOutButton } from '@/components/sign-out-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PushButton } from '@/components/push-button'
import { initials } from '@/lib/format'

export default async function ProfilePage() {
  const { profile, account, user } = await requireAccount()
  const [members, myAccounts] = await Promise.all([
    getMembers(account.id),
    getMyAccounts(),
  ])
  const partner = members.find((m) => m.id !== user.id)
  const isCreator = account.created_by === user.id

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PageHeader
        title="Perfil"
        action={
          <Link
            href="/profile"
            className="flex items-center gap-1.5 pt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" aria-hidden />
            Configurações
          </Link>
        }
      />

      <section className="flex flex-col items-center gap-3 px-5 animate-in fade-in-0 zoom-in-95 duration-400">
        <Avatar className="h-20 w-20 text-xl">
          <AvatarFallback>{initials(profile.display_name)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-semibold">{profile.display_name || 'Sem nome ainda'}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </section>

      <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-75 fill-mode-both">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Seu nome</CardTitle></CardHeader>
          <CardContent>
            <ProfileForm defaultValue={profile.display_name ?? ''} />
          </CardContent>
        </Card>
      </section>

      <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-100 fill-mode-both">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Alterar senha</CardTitle></CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </section>

      <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-125 fill-mode-both">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {myAccounts.length > 1 ? 'Trocar de orçamento' : 'Seus orçamentos'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {myAccounts.length > 1
                ? `Você faz parte de ${myAccounts.length} orçamentos. Trocar não tira você de nenhum deles — é só qual você está vendo agora.`
                : 'Você pode criar outro orçamento a qualquer momento e trocar entre eles.'}
            </p>
            <AccountSwitcher accounts={myAccounts} />
          </CardContent>
        </Card>
      </section>

      <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-150 fill-mode-both">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {partner ? 'Conta compartilhada' : 'Sua conta pessoal'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {account.name} · {members.length} de 2 membros
            </p>

            {partner ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">Compartilhado com <span className="font-medium">{partner.display_name || partner.email}</span></p>
                {isCreator && (
                  <RemovePartnerButton partnerId={partner.id} partnerName={partner.display_name || partner.email || 'essa pessoa'} />
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Convide seu parceiro(a) ou entre com um código.</p>
                <Tabs defaultValue="invite" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="invite">Convidar</TabsTrigger>
                    <TabsTrigger value="join">Usar código</TabsTrigger>
                  </TabsList>
                  <TabsContent value="invite"><InviteCard /></TabsContent>
                  <TabsContent value="join"><JoinCodeForm /></TabsContent>
                </Tabs>
              </>
            )}

            <div className="mt-1 border-t border-border pt-3">
              <p className="text-sm font-medium mb-2">Notificações</p>
              <PushButton />
            </div>

            {/* Discreto de propósito: ação irreversível, separada de
                "trocar de orçamento" (acima, reversível) e de "sair da
                conta" (abaixo, é só logout). */}
            <div className="flex justify-center border-t border-border pt-3">
              <LeaveAccountPermanentlyButton
                accountId={account.id}
                accountName={account.name}
                hasPartner={Boolean(partner)}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-200 fill-mode-both">
        <SignOutButton />
      </section>
    </div>
  )
}