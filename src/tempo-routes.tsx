import Home from "./components/home";
import Dashboard from "./pages/Dashboard";
import CalendarView from "./components/CalendarView";
import WorkflowCanvas from "./components/WorkflowCanvas";

const routes = [
  { path: "/", element: <Home /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/calendar", element: <CalendarView /> },
  { path: "/workflow", element: <WorkflowCanvas /> },
];

export default routes;
