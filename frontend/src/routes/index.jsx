import { BrowserRouter, Routes, Route } from "react-router-dom";

function RouterProvider() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Home Page</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default RouterProvider;
