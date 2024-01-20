import { Server, IncomingMessage, ServerResponse } from 'http';
import WebSocket from 'ws';
import { Game } from './game';
// import queryString from 'query-string';

const game = Game.getInstance();

export const websockets = async (
	expressServer: Server<typeof IncomingMessage, typeof ServerResponse>
) => {
	const websocketServer = new WebSocket.Server({
		noServer: true,
		path: '/'
	});

	expressServer.on('upgrade', (request, socket, head) => {
		websocketServer.handleUpgrade(request, socket, head, (websocket) => {
			websocketServer.emit('connection', websocket, request);
		});
	});

	websocketServer.on(
		'connection',
		function connection(websocketConnection, connectionRequest) {
			const [_path, params] = connectionRequest?.url?.split('?') || [];
			const query = params ? queryString(params) : {};

			const playerId = query.playerId as string;

			websocketConnection.send(
				JSON.stringify({
					channel: 'init',
					data: {
						playersJoined: game.playersJoined(),
						squares: game.squares,
						xIsNext: game.xIsNext()
					}
				})
			);

			websocketConnection.on('message', (message) => {
				const parsedMessage = JSON.parse(message as unknown as string);
				console.log('player: ', playerId);
				console.log(parsedMessage);

				switch (parsedMessage.channel) {
					case 'player-join': {
						if (!game.playerO) {
							game.setPlayerO(playerId);
							sendToAllClients({
								channel: 'player-join',
								data: { playersJoined: game.playersJoined(), playerId }
							});
						} else if (!game.playerX) {
							game.setPlayerX(playerId);
							sendToAllClients({
								channel: 'player-join',
								data: { playersJoined: game.playersJoined(), playerId }
							});
						} else {
							sendToAllClients({
								channel: 'player-join',
								data: { message: 'game full' }
							});
						}
						break;
					}
					case 'player-move': {
						if (game.authPlayer(playerId)) {
							const winner = game.playerMove(parsedMessage.data.index);
							sendToAllClients({
								channel: 'player-move',
								data: {
									squares: game.squares,
									xIsNext: game.xIsNext(),
									winner,
									playerId
								}
							});
						}
						break;
					}
					case 'reset-game': {
						game.resetGame();
						sendToAllClients({
							channel: 'init',
							data: {
								playersJoined: game.playersJoined(),
								squares: game.squares,
								xIsNext: game.xIsNext()
							}
						});
					}
				}
			});
		}
	);

	function sendToAllClients(message: Record<string, any>) {
		websocketServer.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}

	return websocketServer;
};

function queryString(params: string) {
	return JSON.parse(
		`{${params
			.replace(/\=/g, ':')
			.split(':')
			.map((e, i) => `\"${e}\"`)
			.join(':')
			.split('&')
			.join(',')}}`
	);
}
