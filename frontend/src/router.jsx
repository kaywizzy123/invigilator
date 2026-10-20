import { createBrowserRouter } from "react-router";
import App from "./App";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import NewExam from "./pages/NewExam";
import EditExam from "./pages/EditExam";
import SitExam from "./pages/SitExam";
import ExamResult from "./pages/ExamResult";
import ClassResults from "./pages/ClassResults";
import Profile from "./pages/Profile";
import SetPassword from "./pages/SetPassword";
import Classes from "./pages/Classes";
import ClassDetail from "./pages/ClassDetail";
import StudentAnswers from "./pages/StudentAnswers";
import { signUpAction } from "./actions/signUpAction";
import { loginAction } from "./actions/loginAction";
import { logoutAction } from "./actions/logoutAction";
import { createExamAction } from "./actions/createExamAction";
import { editExamAction } from "./actions/editExamAction";
import { publishExamAction } from "./actions/publishExamAction";
import { deleteExamAction } from "./actions/deleteExamAction";
import { duplicateExamAction } from "./actions/duplicateExamAction";
import { closeExamAction } from "./actions/closeExamAction";
import { reopenExamAction } from "./actions/reopenExamAction";
import { setExamClassesAction } from "./actions/setExamClassesAction";
import { startExamAction } from "./actions/startExamAction";
import { sitExamAction } from "./actions/sitExamAction";
import { profileAction } from "./actions/profileAction";
import { setPasswordAction } from "./actions/setPasswordAction";
import { createClassAction } from "./actions/createClassAction";
import { classDetailAction } from "./actions/classDetailAction";
import { joinClassAction } from "./actions/joinClassAction";
import { deleteClassAction } from "./actions/deleteClassAction";
import { rootLoader } from "./loaders/rootLoader";
import { requireTeacher } from "./loaders/requireTeacher";
import { dashboardLoader } from "./loaders/dashboardLoader";
import { editExamLoader } from "./loaders/editExamLoader";
import { sitExamLoader } from "./loaders/sitExamLoader";
import { examResultLoader } from "./loaders/examResultLoader";
import { classResultsLoader } from "./loaders/classResultsLoader";
import { requireUser } from "./loaders/requireUser";
import { setPasswordLoader } from "./loaders/setPasswordLoader";
import { classesLoader } from "./loaders/classesLoader";
import { classDetailLoader } from "./loaders/classDetailLoader";
import { studentAnswersLoader } from "./loaders/studentAnswersLoader";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    element: <App />,
    loader: rootLoader,
    hydrateFallbackElement: <p className="p-6 text-gray-500">Loading...</p>,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login />, action: loginAction },
      { path: "signup", element: <SignUp />, action: signUpAction },
      { path: "logout", action: logoutAction },
      { path: "dashboard", element: <Dashboard />, loader: dashboardLoader, action: joinClassAction },
      { path: "classes", element: <Classes />, loader: classesLoader, action: createClassAction },
      {
        path: "classes/:classId",
        element: <ClassDetail />,
        loader: classDetailLoader,
        action: classDetailAction,
      },
      { path: "classes/:classId/delete", action: deleteClassAction },
      { path: "profile", element: <Profile />, loader: requireUser, action: profileAction },
      { path: "set-password", element: <SetPassword />, loader: setPasswordLoader, action: setPasswordAction },
      { path: "exams/new", element: <NewExam />, loader: requireTeacher, action: createExamAction },
      {
        path: "exams/:examId/edit",
        element: <EditExam />,
        loader: editExamLoader,
        action: editExamAction,
      },
      { path: "exams/:examId/publish", action: publishExamAction },
      { path: "exams/:examId/delete", action: deleteExamAction },
      { path: "exams/:examId/duplicate", action: duplicateExamAction },
      { path: "exams/:examId/close", action: closeExamAction },
      { path: "exams/:examId/reopen", action: reopenExamAction },
      { path: "exams/:examId/classes", action: setExamClassesAction },
      { path: "exams/:examId/start", action: startExamAction },
      {
        path: "exams/:examId/sit",
        element: <SitExam />,
        loader: sitExamLoader,
        action: sitExamAction,
      },
      { path: "exams/:examId/result", element: <ExamResult />, loader: examResultLoader },
      { path: "exams/:examId/results", element: <ClassResults />, loader: classResultsLoader },
      {
        path: "exams/:examId/results/:attemptId",
        element: <StudentAnswers />,
        loader: studentAnswersLoader,
      },
    ],
  },
]);
