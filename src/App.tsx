import { useState } from 'react';
import { useSprings, animated, to as interpolate } from '@react-spring/web';
import { useDrag } from 'react-use-gesture';

import styles from './styles.module.css';
import { Card } from './models/Card';
import { Khal } from './models/Khal';

const cards: string[] = [];


const availableCards: Card[] = [];

const KHALS = ['pike', 'heart', 'clover', 'tile'];

const pictures = ['king', 'queen', 'soldier']

for(const khal of Object.values(Khal)) {
	for(let i = 1; i < 14; i++) {
		availableCards.push(
			{khal, num: i}
		);
	}
}

function generateUserCards(): Card[] {
	const cards: Card[] = [];

	let card: Card, randomIndex: number;

	for(let i = 0; i < 13; i++) {
		randomIndex = Math.random() * (availableCards.length - 1);
		card = availableCards.splice(randomIndex, 1)[0];
		cards.push(card);
	}

	return cards;
}

const userCards = generateUserCards();

for(const khal of KHALS) {
	for(let i = 1; i < 11; i++) {
		cards.push(
			`/assets/cards/back_card.svg`
		);
	}
	
	for(const picture of pictures) {
		cards.push(
			`/assets/cards/${khal}_${picture}.svg`
		);
	}
}

const TURN: number = 0;
const CARDS_PER_PERSON: number = 13;
const SCREEN_MARGIN = 80;

const getBottomProps = (diffFromCenter: number) => {
	return {
		x: diffFromCenter * 35,
		y: window.innerHeight / 2 - SCREEN_MARGIN,
		rot: diffFromCenter * 5
	};
};

const getRightProps = (diffFromCenter: number) => {
	return {
		x: window.innerWidth / 2,
		y: diffFromCenter * 15,
		rot: -(diffFromCenter * 5 + 90)
	};
};

const getTopProps = (diffFromCenter: number) => {
	return {
		x: diffFromCenter * 25,
		y: -(window.innerHeight / 2),
		rot: -(diffFromCenter * 5 + 180)
	};
};

const getLeftProps = (diffFromCenter: number) => {
	return {
		x: -(window.innerWidth / 2),
		y: diffFromCenter * 15,
		rot: diffFromCenter * 5 - 90
	};
};

const getSide = (i: number): any => {
	const diffFromCenter =
		(i % CARDS_PER_PERSON) - Math.ceil(CARDS_PER_PERSON / 2);
	switch (TURN) {
		case 0:
			// ↓
			if (i < CARDS_PER_PERSON) return getBottomProps(diffFromCenter);
			// →
			else if (i < 2 * CARDS_PER_PERSON) return getRightProps(diffFromCenter);
			// ↑
			else if (i < 3 * CARDS_PER_PERSON) return getTopProps(diffFromCenter);
			// ←
			else if (i < 4 * CARDS_PER_PERSON) return getLeftProps(diffFromCenter);
			break;
		case 1:
		case 2:
		case 3:
	}
};

// These two are just helpers, they curate spring data, values that are later being interpolated into css
const to = (i: number) => [
	{
		...getSide(i),
		scale: 1,
		delay: (52 - i) * 100
	}
];
const from = (_i: number) => ({ x: 0, rot: 0, scale: 0.8, y: 0 });
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r: number, s: number) =>
	`perspective(1500px) rotateX(30deg) rotateY(${
		r / 10
	}deg) rotateZ(${r}deg) scale(${s})`;

function Deck() {
	const [gone, setGone] = useState(() => new Set()); // The set flags all the cards that are flicked out
	const [userCards, setUserCards] = useState(generateUserCards())
	const [props, api] = useSprings(cards.length, i => ({
		to: to(i),
		from: from(i)
	})); // Create a bunch of springs using the helpers above

	// Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity
	const bind = useDrag(
		({ args: [index], down, movement: [mx, my], direction: [xDir], velocity }) => {
			const trigger = velocity > 0.2; // If you flick hard enough it should trigger the card to fly out
			const dir = xDir < 0 ? -1 : 1; // Direction should either point left or right
			
			if (down && trigger) gone.add(index);
			api.start(i => {
				if (index !== i) return; // We're only interested in changing spring-data for the current spring
				const isGone = gone.has(index);
				const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0); // How much the card tilts, flicking it harder makes it rotate faster
				const scale = down ? 1.1 : 1; // Active cards lift up a bit
				const initialCooridinates = to(i)[0];

				return {
					x: down ? mx : isGone ? 0 : initialCooridinates.x, 
					y: down ? my : isGone ? -40 : initialCooridinates.y,
					scale: scale,
				};
			});
		}
	, { initial: (comm) => [props[comm.args].x.get(), props[comm.args].y.get()], bounds: comm => !gone.has(props[comm.args]) && ({ left: props[comm.args].x.get(), right: props[comm.args].x.get() -200, top: props[comm.args].y.get() - 60, bottom: props[comm.args].y.get() + 20 })});

	console.log(availableCards, userCards)

	return (
		<>
			{props.map(({ x, y, rot, scale }, i) => (
				<animated.div className={styles.deck} key={i} style={{ x, y }}>
					{/* This is the card itself, we're binding our gesture to it (and inject its index so we know which is which) */}
					<animated.div
						{...bind(i)}
						id="shit"
						style={{
							transform: interpolate([rot, scale], trans),
							backgroundImage: userCards.includes(availableCards[i]) ? `url(/assets/card/${availableCards[i].khal}_${availableCards[i].num}.svg)` : 'url(/assets/cards/back_card.svg)'
						}}
					/>
				</animated.div>
			))}
		</>
	);
}

export default function App() {
	return (
		<div className={styles.container}>
			<Deck />
		</div>
	);
}
