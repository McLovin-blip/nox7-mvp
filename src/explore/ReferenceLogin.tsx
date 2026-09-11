import { Owl } from './Brand.tsx'

export function ReferenceLogin({ onShowHub }: { onShowHub: () => void }) {
  return (
    <div className="html-login">
      <div className="html-login-space" />
      <div className="html-login-ov" />
      <div className="html-login-box">
        <div className="html-login-brand">
          <Owl className="html-login-logo" />
          <div className="html-login-wm">
            Nox<em>7</em>
            <span>.ai</span>
          </div>
          <div className="html-login-tag">AI Cyber Risk Intelligence</div>
        </div>
        <form
          className="html-login-f"
          onSubmit={(event) => {
            event.preventDefault()
            onShowHub()
          }}
        >
          <label>
            <span>Email</span>
            <input type="email" name="email" autoComplete="username" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" autoComplete="current-password" />
          </label>
          <button type="submit">Sign in</button>
          <div className="html-login-links">
            <span>Forgot password</span>
            <span>Prepared for Antler</span>
          </div>
        </form>
      </div>
    </div>
  )
}
