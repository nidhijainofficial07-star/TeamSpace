import { RouterProvider } from "react-router"
import { ToastProvider } from "./app/ToastProvider"
import { WorkspaceProvider } from "./app/WorkspaceProvider"
import { router } from "./app/routes"

export default function App() {
  return (
    <WorkspaceProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </WorkspaceProvider>
  )
}
