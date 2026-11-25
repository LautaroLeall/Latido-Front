import React from 'react';

export default function ContactSection({
  businessName,
  rescueEnabled,
  isLowRating,
  form,
  fieldErrors,
  inputCls,
  labelCls,
  onChange,
  onClearErrors
}) {
  return (
    <div className={`border-[1.5px] border-dashed p-3 my-4 transition-colors ${isLowRating && rescueEnabled ? 'border-alert-red bg-alert-red/5' : 'border-line-gray'}`}>
      <button
        type="button"
        aria-expanded={form.wantContact}
        onClick={() => { onChange({ wantContact: !form.wantContact, contactTouched: true }); onClearErrors(); }}
        className="flex items-start gap-2.5 w-full text-left cursor-pointer py-0.5"
      >
        <span className={`w-5 h-5 border-[1.5px] border-ink flex items-center justify-center shrink-0 font-mono text-sm ${form.wantContact ? 'bg-ink text-paper' : 'bg-paper'}`}>
          {form.wantContact ? '✓' : ''}
        </span>
        <span className="text-[13.5px] font-medium leading-snug min-w-0">
          {isLowRating && rescueEnabled
            ? 'Lamentamos eso. ¿Querés que alguien del local te contacte para solucionarlo?'
            : '¿Querés dejarnos tus datos para que te contactemos?'}
        </span>
      </button>

      {form.wantContact && (
        <div className="grid gap-3 mt-3 pt-3 border-t border-line-gray animate-fadeIn">
          <div className="min-w-0">
            <label htmlFor="c-name" className={labelCls}>Nombre y apellido</label>
            <input
              id="c-name"
              type="text"
              autoComplete="name"
              enterKeyHint="next"
              maxLength={120}
              value={form.name}
              onChange={e => onChange({ name: e.target.value })}
              placeholder="Ej: Martín Gómez"
              aria-invalid={fieldErrors.name ? 'true' : undefined}
              className={`${inputCls} ${fieldErrors.name ? '!border-alert-red' : ''}`}
            />
            {fieldErrors.name && <p className="text-alert-red text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div className="min-w-0">
            <label htmlFor="c-phone" className={labelCls}>Teléfono / WhatsApp</label>
            <input
              id="c-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
              maxLength={25}
              value={form.phone}
              onChange={e => onChange({ phone: e.target.value })}
              placeholder="+54 9 381 555 1234"
              aria-invalid={fieldErrors.phone ? 'true' : undefined}
              className={`${inputCls} ${fieldErrors.phone ? '!border-alert-red' : ''}`}
            />
            {fieldErrors.phone && <p className="text-alert-red text-xs mt-1">{fieldErrors.phone}</p>}
          </div>

          <div className="min-w-0">
            <label htmlFor="c-email" className={labelCls}>Email</label>
            <input
              id="c-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              enterKeyHint="done"
              maxLength={254}
              value={form.email}
              onChange={e => onChange({ email: e.target.value })}
              placeholder="tu@email.com"
              aria-invalid={fieldErrors.email ? 'true' : undefined}
              className={`${inputCls} ${fieldErrors.email ? '!border-alert-red' : ''}`}
            />
            {fieldErrors.email && <p className="text-alert-red text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          <div className="min-w-0">
            <label htmlFor="c-channel" className={labelCls}>¿Cómo preferís que te contacten?</label>
            <select
              id="c-channel"
              value={form.channel}
              onChange={e => onChange({ channel: e.target.value })}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="call">Llamada telefónica</option>
            </select>
          </div>

          <label className="flex items-start gap-2.5 text-xs text-muted mt-1 cursor-pointer leading-relaxed">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={e => onChange({ consent: e.target.checked })}
              className="mt-0.5 w-4 h-4 shrink-0 accent-teal"
            />
            <span className="min-w-0">
              Acepto que {businessName} use estos datos solo para responder a este comentario (Ley 25.326).
              No se usan para publicidad y podés pedir que se borren.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
