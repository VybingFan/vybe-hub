import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/creator/$username')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/creator/$username"!</div>
}
