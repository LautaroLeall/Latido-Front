import React from 'react';
import { Mail, MessageCircle, Phone, User } from 'lucide-react';
import Stamp from '../../../components/ui/Stamp';
import HardButton from '../../../components/ui/HardButton';
import { StarsText } from '../components/PanelBits';
import { formatRelative, getContactUrl, getFirstName, CHANNEL_LABELS } from '../../../lib/utils';

function buildReplyContent(resp, business) {
  const firstName = getFirstName(resp.contact?.full_name) || 'cliente';
  const bizName = business?.name || 'nuestro local';
  const sign = business?.manager_name ? `\n\n— ${business.manager_name}, ${bizName}` : `\n\n— Equipo de ${bizName}`;

  if (resp.stars >= 4) {
    return {
      subject: `¡Muchas gracias por tu opinión sobre ${bizName}!`,
      message: `Hola ${firstName}, ¡muchas gracias por dejarnos ${resp.stars}★ en ${bizName}! Nos alegra muchísimo que hayas tenido una buena experiencia. ¡Te esperamos pronto!${sign}`
    };
  }
  if (resp.stars === 3) {
    return {
      subject: `Gracias por tu opinión sobre ${bizName}`,
      message: `Hola ${firstName}, gracias por tomarte un momento para dejarnos tu opinión sobre ${bizName}. Tu comentario nos ayuda a seguir mejorando. ¡Te esperamos de vuelta!${sign}`
    };
  }
  return {
    subject: `Sobre tu visita a ${bizName}`,
    message: `Hola ${firstName}, recibimos tu opinión sobre ${bizName} y queremos comunicarnos con vos para solucionarlo cuanto antes.${sign}`
  };
}

function ContactDetailsBox({ resp, business }) {
  const contact = resp.contact;
  if (!contact) return null;

  const { subject, message } = buildReplyContent(resp, business);
  const waUrl = getContactUrl('whatsapp', contact, message);
  const gmailUrl = getContactUrl('gmail', contact, message, { subject });
  const mailUrl = getContactUrl('email', contact, message, { subject });
  const callUrl = getContactUrl('call', contact);
  const cleanPhoneDisplay = contact.phone ? `+${String(contact.phone).replace(/^\+/, '')}` : null;
  const preferred = contact.preferred_channel || 'whatsapp';

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-line-gray space-y-2.5">
      <div className="bg-paper-dim border border-line-gray px-3 py-2.5 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold text-ink min-w-0">
            <User size={13} className="text-teal shrink-0" />
            <span className="break-words">{contact.full_name}</span>
          </span>
          <span className="text-[10.5px] uppercase tracking-wider text-muted shrink-0">
            Prefiere: <strong className="text-ink">{CHANNEL_LABELS[preferred] || preferred}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
          {cleanPhoneDisplay && (
            <span className="inline-flex items-center gap-1.5 select-all break-all">
              <Phone size={12} className="shrink-0 text-ink/70" />
              <span className="text-ink">{cleanPhoneDisplay}</span>
            </span>
          )}
          {contact.email && (
            <span className="inline-flex items-center gap-1.5 select-all break-all">
              <Mail size={12} className="shrink-0 text-ink/70" />
              <span className="text-ink">{contact.email}</span>
            </span>
          )}
        </div>
      </div>

      {(waUrl || gmailUrl || mailUrl || callUrl) && (
        <div className="flex flex-wrap gap-2">
          {waUrl && (
            <HardButton
              as="a"
              size="sm"
              variant={preferred === 'whatsapp' ? 'teal' : 'secondary'}
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={13} /> WhatsApp
            </HardButton>
          )}
          {gmailUrl && (
            <HardButton
              as="a"
              size="sm"
              variant={preferred === 'email' ? 'teal' : 'secondary'}
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={13} /> Gmail
            </HardButton>
          )}
          {mailUrl && (
            <HardButton
              as="a"
              size="sm"
              variant="secondary"
              href={mailUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={13} /> Email
            </HardButton>
          )}
          {callUrl && (
            <HardButton
              as="a"
              size="sm"
              variant={preferred === 'call' ? 'teal' : 'secondary'}
              href={callUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone size={13} /> Llamar
            </HardButton>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResponseCard({ resp, business, now }) {
  return (
    <article
      className={`p-4 bg-paper border border-line-gray border-l-4 animate-fadeIn flex flex-col justify-between ${resp.stars <= 2 ? 'border-l-alert-red' : resp.stars === 3 ? 'border-l-amber' : 'border-l-teal'
        }`}
    >
      <div>
        <div className="flex justify-between items-start gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <StarsText value={resp.stars} />
            <span className="font-mono text-xs text-muted">
              {formatRelative(resp.created_at, now)}
              {resp.branch?.name ? ` · ${resp.branch.name}` : ''}
            </span>
          </div>
          {resp.contact ? (
            <Stamp variant={resp.stars >= 4 ? 'teal' : 'amber'}>Dejó contacto</Stamp>
          ) : (
            <Stamp variant="ink">Anónimo</Stamp>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed break-words">
          {resp.comment ? `“${resp.comment}”` : <span className="text-muted italic">Sin comentario</span>}
        </p>
        {resp.tags?.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
            {resp.tags.map(t => <span key={t} className="font-mono text-xs text-muted">#{t}</span>)}
          </div>
        )}
      </div>
      <ContactDetailsBox resp={resp} business={business} />
    </article>
  );
}
