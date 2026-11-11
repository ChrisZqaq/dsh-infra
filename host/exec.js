/**
 * One bounded command run through the host `subprocess` service.
 * Never throws: a failed spawn reads as a failed check, not as a broken panel.
 */
export async function run(spawn, { argv, cwd, timeoutMs = 6000, signal }) {
  const started = Date.now()
  let handle
  try {
    handle = spawn({
      argv,
      cwd: cwd ?? process.env.HOME ?? '/',
      stdio: {
        stdin: 'ignore',
        stdout: { maxBytes: 64 * 1024 },
        stderr: { maxBytes: 32 * 1024 },
      },
      graceMs: 1500,
      signal,
    })
  } catch (error) {
    return { ok: false, code: null, stdout: '', stderr: String(error?.message ?? error), ms: 0 }
  }
  let timer
  const timeout = new Promise((resolvePromise) => {
    timer = setTimeout(() => {
      try {
        handle.terminate()
      } catch {}
      resolvePromise({ exitCode: null, signal: 'TIMEOUT' })
    }, timeoutMs)
    timer.unref?.()
  })
  let outcome
  try {
    outcome = await Promise.race([handle.done, timeout])
  } catch (error) {
    outcome = { exitCode: null, signal: null, error: String(error?.message ?? error) }
  } finally {
    clearTimeout(timer)
  }
  const read = (reader) => {
    try {
      return reader ? reader.readFrom(0).text : ''
    } catch {
      return ''
    }
  }
  return {
    ok: outcome?.exitCode === 0,
    code: outcome?.exitCode ?? null,
    stdout: read(handle.collected?.stdout),
    stderr: read(handle.collected?.stderr),
    ms: Date.now() - started,
  }
}
