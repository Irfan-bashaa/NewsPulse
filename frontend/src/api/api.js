import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_GEMINI_API_KEY,
});

export default API;