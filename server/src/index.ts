import express, { Express, Request, Response } from 'express';
import { websockets } from './utils/websockets';

const app: Express = express();
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
	res.send('Express + TypeScript Server');
});

const server = app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`);
});

websockets(server);
