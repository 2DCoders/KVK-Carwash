import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  CarFront,
  X,
  CheckCircle,
  ShieldCheck,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNavigate } from 'react-router-dom'
import { login } from '@/services/auth-api'
import Alert from '@/components/ui/alert'

type PageAlert = {
  visible: boolean
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  description?: string
}

export default function Login() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  })

  const [pageAlert, setPageAlert] = useState<PageAlert>({
    visible: false,
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setLoading(true)
    setPageAlert({ visible: false })

    try {
      const cashier = await login(
        formData.userId,
        formData.password,
      )

      localStorage.setItem('cashier', JSON.stringify(cashier))
      navigate('/services')
    } catch (error) {
      console.error('Login failed:', error)

      setPageAlert({
        visible: true,
        variant: 'error',
        title: 'Login Failed',
        description: 'Invalid user ID or password.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setForgotLoading(true)

    try {
      // Replace this with your forgot-password API.
      await new Promise((resolve) => setTimeout(resolve, 1200))

      setForgotSuccess(true)
    } catch (error) {
      console.error('Password reset request failed:', error)

      setPageAlert({
        visible: true,
        variant: 'error',
        title: 'Request Failed',
        description: 'Unable to send the password reset request.',
      })

      setShowForgotModal(false)
    } finally {
      setForgotLoading(false)
    }
  }

  const closeForgotModal = () => {
    setShowForgotModal(false)
    setForgotEmail('')
    setForgotSuccess(false)
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#020817]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#061a35_48%,#082b55_100%)]" />

        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-500/15 blur-[100px]" />
        <div className="absolute -bottom-32 right-[-5rem] h-96 w-96 rounded-full bg-cyan-400/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 flex h-full w-full">
        {/* Left panel */}
        <section className="hidden h-full w-[42%] flex-col justify-between border-r border-white/10 px-10 py-8 lg:flex xl:px-16">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 shadow-lg shadow-blue-950/40">
                <CarFront className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  KVK Car Wash
                </h1>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                  Admin Management
                </p>
              </div>
            </div>

            <div className="mt-20 max-w-md">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure administration
              </div>

              <h2 className="text-4xl font-bold leading-tight text-white">
                Premium car wash management.
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                Manage services, payments and daily operations from one
                secure dashboard.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Service Management
                    </p>
                    <p className="text-xs text-slate-500">
                      Manage washes, detailing and packages.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <BarChart3 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Revenue Tracking
                    </p>
                    <p className="text-xs text-slate-500">
                      Monitor payments and daily totals.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Secure Staff Access
                    </p>
                    <p className="text-xs text-slate-500">
                      Protected access for authorized users.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="border-t border-white/10 pt-5 text-xs text-slate-500">
            © 2026 KVK Car Wash. Developed by{' '}
            <span className="font-semibold text-slate-300">
              2D-Coders
            </span>
          </p>
        </section>

        {/* Right panel */}
        <main className="flex h-full w-full items-center justify-center px-4 lg:w-[58%] bg-white/95 backdrop-blur-lg">
          <div className="w-full max-w-[410px]">
            {pageAlert.visible && (
              <div className="mb-3">
                <Alert
                  variant={pageAlert.variant as any}
                  title={pageAlert.title}
                  description={pageAlert.description}
                  onClose={() =>
                    setPageAlert((previous) => ({
                      ...previous,
                      visible: false,
                    }))
                  }
                />
              </div>
            )}

            {/* Mobile logo */}
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-800">
                <CarFront className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="text-lg font-bold text-white">
                  KVK Car Wash
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-blue-300">
                  Admin Portal
                </p>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/[0.055] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="mb-5">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1 text-[11px] font-medium text-blue-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure administrator access
                </div>

                <h2 className="text-3xl font-bold text-black/90">
                  Welcome back
                </h2>

                <p className="mt-1.5 text-sm text-slate-400">
                  Sign in to access the car wash dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="userId"
                    className="text-sm font-semibold text-slate-500"
                  >
                    User ID
                  </Label>

                  <div className="group relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400" />

                    <Input
                      id="userId"
                      name="userId"
                      type="text"
                      placeholder="Enter your user ID"
                      value={formData.userId}
                      onChange={handleChange}
                      autoComplete="username"
                      className="h-11 rounded-xl border-white/10 bg-[#061329]/80 pl-10 text-white placeholder:text-slate-600 hover:border-blue-400/30 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-500"
                  >
                    Password
                  </Label>

                  <div className="group relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400" />

                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      className="h-11 rounded-xl border-white/10 bg-[#061329]/80 pl-10 pr-11 text-white placeholder:text-slate-600 hover:border-blue-400/30 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      className="absolute cursor-pointer right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-blue-300"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs cursor-pointer font-medium text-blue-400 transition hover:text-blue-200"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="group h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 font-semibold text-white shadow-lg shadow-blue-950/30 hover:from-blue-500 hover:to-blue-700"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>

                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 cursor-pointer w-4 transition-transform group-hover:translate-x-0.5" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {/* <div className="mt-5 border-t border-white/10 pt-4 text-center">
                <p className="text-xs text-slate-500">
                  Need access?{' '}
                  <button
                    type="button"
                    className="cursor-pointer font-semibold text-blue-400 hover:text-blue-200"
                  >
                    Contact administrator
                  </button>
                </p>
              </div> */}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Lock className="h-3.5 w-3.5" />
              <span>Your login information is securely protected</span>
            </div>
          </div>
        </main>
      </div>

      {/* Forgot password modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#071429] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-800 to-[#0b376d] px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Reset Password
                </h3>

                <p className="mt-0.5 text-xs text-blue-200">
                  Request a password reset.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForgotModal}
                className="rounded-lg p-2 cursor-pointer text-blue-100 transition hover:bg-white/10"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {!forgotSuccess ? (
                <form
                  onSubmit={handleForgotSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="forgotEmail"
                      className="text-sm font-semibold text-slate-200"
                    >
                      Email or User ID
                    </Label>

                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <Input
                        id="forgotEmail"
                        type="text"
                        placeholder="Enter email or user ID"
                        value={forgotEmail}
                        onChange={(event) =>
                          setForgotEmail(event.target.value)
                        }
                        className="h-11 rounded-xl border-white/10 bg-[#041022] pl-10 text-white placeholder:text-slate-600 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    className="h-10 w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 font-semibold text-white hover:from-blue-500 hover:to-blue-700"
                  >
                    {forgotLoading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />

                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>

                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Reset Request
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForgotModal}
                    className="h-10 w-full cursor-pointer rounded-xl border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10">
                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                  </div>

                  <h4 className="text-lg font-bold text-white">
                    Request Sent
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Check your registered email for password reset
                    instructions.
                  </p>

                  <Button
                    type="button"
                    onClick={closeForgotModal}
                    className="mt-4 h-10 w-full rounded-xl bg-blue-700 text-white hover:bg-blue-600"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}