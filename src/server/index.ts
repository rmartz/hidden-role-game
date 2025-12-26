import type { Express } from "express";
import express from 'express';
import { router } from './routes';

const app: Express = express();
const port = 3000;

app.use(express.json());
app.use(router);

app.listen(port, () => {
    console.log(`Secret Villain Game server listening on port ${port}`);
});
