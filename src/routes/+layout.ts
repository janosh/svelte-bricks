import { redirect } from '@sveltejs/kit'

export const prerender = true

export const load = ({ url }: { url: URL }) => {
  if (url.pathname.endsWith(`.md`)) {
    redirect(307, url.pathname.replace(/\.md$/u, ``))
  }
}
