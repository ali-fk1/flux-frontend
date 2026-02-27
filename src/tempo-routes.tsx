import Home from "./components/home";
import Dashboard from "./pages/Dashboard";
import CalendarView from "./components/CalendarView";
import WorkflowCanvas from "./components/WorkflowCanvas";
import ScheduledPostsView from "./components/ScheduledPostsView";
import { ProtectedRoute } from "./components/ProtectedRoute";

const routes = [
  { path: "/", element: <Home /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/calendar", element: <CalendarView /> },
  { path: "/workflow", element: <WorkflowCanvas /> },
  {
    path: "/scheduled-posts",
    element: (
      <ProtectedRoute>
        <ScheduledPostsView />
      </ProtectedRoute>
    ),
  },
];

export default routes;
