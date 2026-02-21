import AppRouter from './router/AppRouter'
import { Toaster } from './components/ui/toaster'

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  )
}
