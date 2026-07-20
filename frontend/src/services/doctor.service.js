// doctor.service.js

import axios from "../api/axios";

export const getDoctors = () => {
    return axios.get("/doctors");
};

export const getDoctorById = (id) => {
    return axios.get(`/doctors/${id}`);
};