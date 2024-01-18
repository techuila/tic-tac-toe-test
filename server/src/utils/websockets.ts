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
			// const connectionParams = queryString.parse(params);

			// NOTE: connectParams are not used here but good to understand how to get
			// to them if you need to pass data with the connection to identify it (e.g., a userId).
			// console.log(connectionParams);

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
				console.log(parsedMessage);

				websocketServer.clients.forEach((client) => {
					if (client.readyState === WebSocket.OPEN) {
						switch (parsedMessage.channel) {
							case 'player-join': {
								if (!game.playerO) {
									game.setPlayerO(parsedMessage.data.playerId);
									client.send(
										JSON.stringify({
											channel: 'player-join',
											data: { playersJoined: game.playersJoined() }
										})
									);
								} else if (!game.playerX) {
									game.setPlayerX(parsedMessage.data.playerId);
									client.send(
										JSON.stringify({
											channel: 'player-join',
											data: { playersJoined: game.playersJoined() }
										})
									);
								} else {
									client.send(
										JSON.stringify({
											channel: 'player-join',
											data: { message: 'game full' }
										})
									);
								}
								break;
							}
							case 'player-move': {
								if (game.authPlayer(parsedMessage.data.playerId)) {
									game.playerMove(parsedMessage.data.index);
									JSON.stringify({
										channel: 'player-move',
										data: { squares: game.squares, xIsNext: game.xIsNext() }
									});
								}
							}
						}
					}
				});
			});
		}
	);

	return websocketServer;
};
