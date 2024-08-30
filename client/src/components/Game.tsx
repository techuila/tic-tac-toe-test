import { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { v4 as uuid } from 'uuid';
const playerId = uuid();
interface SquareProps {
	value: string;
	onSquareClick: () => void;
}

function Square({ value, onSquareClick }: SquareProps) {
	return (
		<button className='square' onClick={onSquareClick}>
			{value}
		</button>
	);
}

interface BoardProps {
	xIsNext: boolean;
	squares: string[];
	onPlay: (i: number) => void;
	playersJoined: number;
	winner: string | null;
	playerTurn: boolean;
	playerWin: boolean;
}

function Board({
	xIsNext,
	squares,
	onPlay,
	playersJoined,
	playerTurn,
	winner,
	playerWin
}: BoardProps) {
	function handleClick(i: number) {
		if (winner || squares[i] !== '' || !playerTurn) {
			return;
		}
		onPlay(i);
	}

	let status;
	if (playersJoined < 2) {
		status = 'Waiting for player to join...';
	} else {
		if (winner) {
			status = playerWin ? 'You win!' : 'You lose!';
		} else {
			status = 'Next player: ' + (xIsNext ? 'X' : 'O');
		}
	}

	return (
		<>
			<div className='status'>{status}</div>
			<div className='board-row'>
				<Square value={squares[0]} onSquareClick={() => handleClick(0)} />
				<Square value={squares[1]} onSquareClick={() => handleClick(1)} />
				<Square value={squares[2]} onSquareClick={() => handleClick(2)} />
			</div>
			<div className='board-row'>
				<Square value={squares[3]} onSquareClick={() => handleClick(3)} />
				<Square value={squares[4]} onSquareClick={() => handleClick(4)} />
				<Square value={squares[5]} onSquareClick={() => handleClick(5)} />
			</div>
			<div className='board-row'>
				<Square value={squares[6]} onSquareClick={() => handleClick(6)} />
				<Square value={squares[7]} onSquareClick={() => handleClick(7)} />
				<Square value={squares[8]} onSquareClick={() => handleClick(8)} />
			</div>
		</>
	);
}

export default function Game() {
	const [xIsNext, setXIsNext] = useState(true);
	const [squares, setSquares] = useState(Array(9).fill(null));
	const [playersJoined, setPlayersJoined] = useState(0);
	const [winner, setWinner] = useState(null);
	const [playerWin, setPlayerWin] = useState(false);
	const [playerJoined, setPlayerJoined] = useState(false);
	const [playerTurn, setPlayerTurn] = useState(false);

	const WS_URL = `ws://localhost:3000/?playerId=${playerId}`;
	const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
		WS_URL,
		{
			share: false
			// shouldReconnect: () => true
		}
	);

	useEffect(() => {
		if (readyState === ReadyState.OPEN) {
			console.log('WS Connected');
		}
	}, [readyState]);

	useEffect(() => {
		if (lastJsonMessage === null) return;
		const msg = lastJsonMessage as { channel: string; data: any };
		switch (msg.channel) {
			case 'init': {
				setSquares(msg.data.squares);
				setPlayersJoined(msg.data.playersJoined);
				setXIsNext(msg.data.xIsNext);
				setWinner(null);
				setPlayerWin(false);
				setPlayerJoined(false);
				setPlayerTurn(false);
				break;
			}
			case 'player-join': {
				setPlayersJoined(msg.data.playersJoined);
				if (!playerJoined) {
					setPlayerJoined(msg.data.playerId === playerId);
				}
				if (msg.data.playersJoined === 2) {
					setPlayerTurn(msg.data.playerId === playerId);
				}
				break;
			}
			case 'player-move': {
				setSquares(msg.data.squares);
				setXIsNext(msg.data.xIsNext);
				setWinner(msg.data.winner);
				setPlayerTurn(msg.data.playerId !== playerId);

				if (msg.data.winner && msg.data.playerId === playerId) {
					setPlayerWin(true);
				}
				break;
			}
			case 'game-over': {
				setWinner(msg.data.winner);
				break;
			}
		}
		console.log(
			`Got a new message: ${JSON.stringify(lastJsonMessage, null, 2)}`
		);
	}, [lastJsonMessage]);

	function handlePlay(i: number) {
		sendJsonMessage({
			channel: 'player-move',
			data: {
				index: i
			}
		});
	}

	return (
		<div className='game'>
			<div className='game-board'>
				<Board
					xIsNext={xIsNext}
					squares={squares}
					onPlay={handlePlay}
					playersJoined={playersJoined}
					playerTurn={playerTurn}
					winner={winner}
					playerWin={playerWin}
				/>
			</div>
			<div className='game-info'>
				<button
					onClick={() =>
						sendJsonMessage({
							channel: 'player-join',
							data: {}
						})
					}
					disabled={playersJoined >= 2 || playerJoined}
				>
					Join Game as {playersJoined % 2 === 0 ? 'O' : 'X'}
				</button>
				{winner && (
					<button
						onClick={() =>
							sendJsonMessage({
								channel: 'reset-game',
								data: {}
							})
						}
					>
						Reset Game
					</button>
				)}
			</div>
		</div>
	);
}
