import 'server-only'
import { store } from './store'

export type Mail = { to: string; subject: string; text: string }

let transport: { sendMail: (m: Mail & { from: string }) => Promise<unknown> } | null | undefined

async function getTransport() {
  if (transport !== undefined) return transport
  if (!process.env.SMTP_URL) return (transport = null)
  const nodemailer = await import('nodemailer')
  transport = nodemailer.createTransport(process.env.SMTP_URL)
  return transport
}

/** Never throws: email problems must not fail an order. */
export async function sendMail(mail: Mail) {
  if (process.env.E2E === '1') {
    store().outbox.push(mail)
    return
  }
  try {
    const t = await getTransport()
    if (!t) {
      console.info(`[mail] to=${mail.to} subject="${mail.subject}"\n${mail.text}`)
      return
    }
    await t.sendMail({ from: process.env.MAIL_FROM || "Jeff's Taproom & Grill <no-reply@localhost>", ...mail })
  } catch (err) {
    console.error('[mail] failed', err)
  }
}
