import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { requireAccount, getMembers } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { ProfileForm } from '@/components/profile-form'
import { InviteCard } from '@/components/invite-card'
import { JoinCodeForm } from '@/components/join-code-form'
import { RemovePartnerButton } from '@/components/remove-partner-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { initials } from '@/lib/format'

export default async function ProfilePage() {
  const { profile, account, user } = await requireAccount()
  const members = await getMembers(account.id)
  const partner = members.find((m) => m.id !== user.id)
  const isCreator = account.created_by === user.id

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PageHeader
        title="Perfil"
        action={
          <Link
            href="/settings"
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
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
