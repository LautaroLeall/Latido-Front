import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Stamp from '../../components/ui/Stamp';
import HardButton from '../../components/ui/HardButton';
import StarIcon from '../../components/ui/StarIcon';
import LatidoSymbol from '../../components/branding/LatidoSymbol';
import BusinessLogo from '../../components/branding/BusinessLogo';
import TicketCard from '../../components/ui/TicketCard';
import { resolveSurveyConfig } from '../../lib/surveyConfig';
import { isSafeHttpsUrl } from '../../lib/utils';
import { usePageMeta } from '../../lib/seo';
import { MOODS, useFeedbackTicket } from './useFeedbackTicket';
import ContactSection from './ContactSection';
import { DirectGoogleView, FeedbackStatusView, FeedbackSubmittedView } from './FeedbackStates';

const INPUT_CLS =
  'w-full max-w-full min-w-0 min-h-[44px] bg-paper text-ink border-[1.5px] border-ink px-3 py-2.5 text-base sm:text-sm ' +
  'focus:border-teal focus:shadow-[2px_2px_0px_#1F6F64] outline-none rounded-none transition-shadow';
const LABEL_CLS = 'block font-mono text-[10.5px] uppercase tracking-wider text-muted mb-1';

export default function FeedbackView() {
  const { token } = useParams();
  const ticket = useFeedbackTicket(token);
  const { isDemo, business, loadState, form, errors, fieldErrors, isLowRating, isSubmitting } = ticket;

  usePageMeta({
    title: isDemo
      ? 'Probá el Ticket de Opinión QR y NFC en Vivo | Latido'
      : business?.business_name
        ? `${business.business_name} · Tu opinión`
        : 'Ticket de opinión · Latido',
    description: isDemo
      ? 'Probá en vivo el ticket digital QR y NFC de Latido sin registrarte: calificá en 30 segundos, elegí aspectos y descubrí el flujo de Google y Modo Rescate.'
      : business?.business_name
        ? `Contanos en 30 segundos cómo fue tu experiencia en ${business.business_name}.`
        : 'Dejá tu opinión en 30 segundos.',
    noindex: !isDemo
  });

  const wrapper = (children) => (
    <div className="min-h-[100dvh] w-full flex flex-col justify-center px-3.5 sm:px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.75rem,env(safe-area-inset-bottom))] md:py-10">
      <div className="w-full max-w-[440px] mx-auto min-w-0">
        {isDemo && (
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-dashed border-line-gray">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-ink hover:text-teal transition-colors py-1"
            >
              ← Volver a Latido
            </Link>
            <Stamp variant="amber">Demo</Stamp>
          </div>
        )}
        {children}
      </div>
    </div>
  );

  if (loadState !== 'ready') {
    return wrapper(<FeedbackStatusView loadState={loadState} onRetry={() => ticket.loadBusiness()} />);
  }

  const businessName = business.business_name;
  const survey = resolveSurveyConfig(business.survey_questions);
  const showGoogleAfter = business.review_destination === 'both' && isSafeHttpsUrl(business.google_review_url);

  if (ticket.directGoogle) {
    return wrapper(
      <DirectGoogleView
        business={business}
        opened={ticket.directGoogleOpened}
        onMarkOpened={() => ticket.setDirectGoogleOpened(true)}
      />
    );
  }

  if (ticket.submitted) {
    return wrapper(
      <FeedbackSubmittedView
        business={business}
        isDemo={isDemo}
        wantContact={form.wantContact}
        showGoogleAfter={showGoogleAfter}
        googleDeclined={ticket.googleDeclined}
        googleOpened={ticket.googleOpened}
        onGoogleOpened={() => ticket.setGoogleOpened(true)}
        onGoogleDeclined={() => ticket.setGoogleDeclined(true)}
        onResetDemo={ticket.resetForm}
      />
    );
  }

  return wrapper(
    <>
      <form onSubmit={ticket.handleSubmit} noValidate>
        <TicketCard bodyClassName="px-4 sm:px-6 py-5">
          {/* Cabecera */}
          <div className="flex justify-between gap-2 font-mono text-muted text-[11px] mb-3">
            <span className="truncate">TICKET DE OPINIÓN</span>
            <span className="shrink-0">{new Date().toLocaleDateString('es-AR')}</span>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <BusinessLogo name={businessName} logoUrl={business.logo_url} size={48} />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold leading-tight tracking-tight break-words">{businessName}</h1>
              <span className="font-mono text-muted text-xs block break-words">{business.branch_name}</span>
            </div>
          </div>

          <div className="border-t-[1.5px] border-dashed border-line-gray my-4" />

          {/* Estrellas */}
          <div className="text-base font-semibold leading-snug break-words" id="stars-label">{survey.starsQuestion}</div>
          <div className="flex items-center justify-between sm:justify-start sm:gap-1.5 my-3" role="radiogroup" aria-labelledby="stars-label">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                type="button"
                role="radio"
                aria-checked={form.stars === val}
                onClick={() => ticket.handleStarClick(val)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer touch-manipulation"
                aria-label={`${val} ${val === 1 ? 'estrella' : 'estrellas'}`}
              >
                <StarIcon size={36} filled={val <= form.stars} />
              </button>
            ))}
          </div>
          <div className={`font-mono font-bold text-xs uppercase tracking-wider min-h-[18px] ${isLowRating ? 'text-alert-red' : 'text-teal'}`} aria-live="polite">
            {MOODS[form.stars]}
          </div>

          {/* Etiquetas */}
          {form.stars > 0 && survey.tagsEnabled && survey.tags.length > 0 && (
            <div className="my-3 animate-fadeIn">
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                {survey.tagsQuestion || (isLowRating ? '¿Qué falló?' : '¿Qué destacás?')} (opcional)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {survey.tags.map(tag => {
                  const selected = form.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => ticket.toggleTag(tag)}
                      aria-pressed={selected}
                      className={`font-mono text-xs px-2.5 py-1.5 min-h-[36px] max-w-full break-words text-left border-[1.5px] transition-colors cursor-pointer touch-manipulation ${selected ? 'border-teal text-teal bg-teal/10' : 'border-line-gray text-muted hover:border-ink'}`}
                    >
                      {selected ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comentario */}
          {survey.commentEnabled && (
            <div className="mt-3">
              <label htmlFor="comment" className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
                {survey.commentQuestion}
              </label>
              <textarea
                id="comment"
                rows={3}
                maxLength={1000}
                value={form.comment}
                onChange={e => ticket.setField({ comment: e.target.value })}
                placeholder={survey.commentPlaceholder}
                className={`${INPUT_CLS} resize-y`}
              />
              {form.comment.length > 800 && (
                <div className="font-mono text-[10px] text-muted text-right">{form.comment.length}/1000</div>
              )}
            </div>
          )}

          {/* Honeypot anti-bots */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="website">Sitio web</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={e => ticket.setField({ website: e.target.value })}
            />
          </div>

          <ContactSection
            businessName={businessName}
            rescueEnabled={business.rescue_enabled}
            isLowRating={isLowRating}
            form={form}
            fieldErrors={fieldErrors}
            inputCls={INPUT_CLS}
            labelCls={LABEL_CLS}
            onChange={ticket.setField}
            onClearErrors={() => ticket.setErrors([])}
          />

          {errors.length > 0 && (
            <div role="alert" className="mb-3">
              <ul className="text-alert-red text-xs list-disc pl-5 space-y-0.5">
                {errors.map((err) => <li key={err}>{err}</li>)}
              </ul>
            </div>
          )}

          <HardButton type="submit" disabled={form.stars === 0 || isSubmitting} className="w-full">
            {isSubmitting ? 'ENVIANDO...' : 'ENVIAR OPINIÓN'}
          </HardButton>

          <div className="border-t border-dashed border-line-gray mt-5 pt-3 flex items-center justify-center">
            <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-teal transition-colors py-1">
              <span>Con tecnología de</span>
              <LatidoSymbol width={20} />
              <span className="font-sans font-bold text-ink text-sm">Latido</span>
            </Link>
          </div>
        </TicketCard>
      </form>

      <p className="font-mono text-muted text-[11px] text-center mt-3">
        Anónimo por defecto · dejar contacto es 100% opcional
      </p>
    </>
  );
}
