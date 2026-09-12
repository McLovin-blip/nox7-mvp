import { useRef } from 'react'
import { data } from '../mock/data.ts'
import { ModuleFrame, Pill, RecordList } from '../modules/Records.tsx'
import '../modules/modules.css'
import { useSession } from '../state/SessionProvider.tsx'

export function EvidenceModule({
  selectedId,
  onSelect,
  onApproved,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
  onApproved: () => void
}) {
  const { view, phase, uploads, startUpload, setMetadata, approve, reject } = useSession()
  const fileRef = useRef<HTMLInputElement>(null)

  if (phase === 'processing' || phase === 'review') {
    return (
      <ModuleFrame
        kicker="Evidence"
        title={phase === 'processing' ? 'Processing assessments' : 'Review suggested mappings'}
        lede={
          phase === 'processing'
            ? 'Files are being uploaded, processed and indexed. Nothing in the organisation position changes yet.'
            : 'Nox AI has proposed classification and mappings. Approve to update Hub, Regulatory, Controls, Risks, Reports and Activity. Reject leaves the position unchanged.'
        }
      >
        <div className="mod" style={{ padding: 0, gap: 10 }}>
          {uploads.map((item) => (
            <article key={item.id} className="file">
              <header>
                <div>
                  <strong>{item.filename}</strong>
                  <em style={{ display: 'block', color: 'var(--text-2)', fontStyle: 'normal', fontSize: 12 }}>
                    {item.stage}
                  </em>
                </div>
                <Pill
                  tone={
                    item.outcome === 'success' ? 'assured' : item.outcome === 'duplicate' ? 'partial' : 'attention'
                  }
                >
                  {item.outcome === 'success' ? 'Ready' : item.outcome === 'duplicate' ? 'Duplicate' : 'Metadata'}
                </Pill>
              </header>
              {phase === 'processing' ? (
                <i className="bar">
                  <b style={{ width: `${item.progress}%` }} />
                </i>
              ) : null}
              {phase === 'review' && item.outcome === 'success' ? (
                <>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                    Suggested classification · {item.classification}
                  </p>
                  <div className="chips">
                    {item.controlTitles.map((title) => (
                      <span key={title}>{title}</span>
                    ))}
                    {item.obligationTitles.map((title) => (
                      <span key={title}>{title}</span>
                    ))}
                  </div>
                </>
              ) : null}
              {phase === 'review' && item.outcome === 'duplicate' ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                  Duplicate of {item.duplicateOfTitle}. Not used to close the gap.
                </p>
              ) : null}
              {phase === 'review' && item.outcome === 'missing_metadata' ? (
                <>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                    Owner and review date are missing. Complete them to include this note, or leave it out of the
                    approval.
                  </p>
                  <div className="meta-fields">
                    <label>
                      Owner
                      <select
                        value={item.owner}
                        onChange={(event) => setMetadata(item.id, 'owner', event.target.value)}
                      >
                        <option value="">Select</option>
                        {data.people.map((person) => (
                          <option key={person.id} value={person.name}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Review date
                      <input
                        type="date"
                        value={item.reviewDate}
                        onChange={(event) => setMetadata(item.id, 'reviewDate', event.target.value)}
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </article>
          ))}
          {phase === 'review' ? (
            <div className="row-actions">
              <button
                className="primary"
                type="button"
                onClick={() => {
                  approve()
                  onApproved()
                }}
              >
                Approve mappings
              </button>
              <button className="danger" type="button" onClick={reject}>
                Reject
              </button>
            </div>
          ) : null}
        </div>
      </ModuleFrame>
    )
  }

  return (
    <ModuleFrame
      kicker="Evidence"
      title="Catalogue"
      lede={
        view.position === 'after'
          ? 'The 2026 critical-supplier assessments are current. The 2023 pack is superseded. A duplicate questionnaire remains flagged.'
          : 'Current critical-supplier assessments are missing. Upload several files in one action, then review and approve.'
      }
    >
      {view.position === 'before' ? (
        <div className="drop">
          <strong>Upload current critical-supplier assessments</strong>
          <p>Select several files in one action. Suggested mappings will wait for your approval.</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.zip,.docx,.doc"
            hidden
            onChange={(event) => {
              if (event.target.files && event.target.files.length > 0) startUpload()
              event.target.value = ''
            }}
          />
          <button className="primary" type="button" onClick={() => fileRef.current?.click()}>
            Select files
          </button>
        </div>
      ) : null}
      <RecordList rows={view.evidence} selectedId={selectedId} onSelect={onSelect} />
    </ModuleFrame>
  )
}
