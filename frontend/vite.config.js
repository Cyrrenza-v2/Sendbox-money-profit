import { defineConfig } from "vite"; import react from "@vitejs/plugin-react";
export default defineConfig({plugins:[react()],base:"/Sendbox-money-profit/",server:{port:3000}});