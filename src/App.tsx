import { useState } from 'react';
import { useSprings, animated, to as interpolate } from '@react-spring/web';
import { useDrag } from 'react-use-gesture';

import styles from './styles.module.css';

const cards: string[] = [];

for (let i = 0; i < 52; i++)
	cards.push(
		'https://upload.wikimedia.org/wikipedia/en/f/f5/RWS_Tarot_08_Strength.jpg'
	);

// const cards = [
// 	'https://upload.wikimedia.org/wikipedia/en/f/f5/RWS_Tarot_08_Strength.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/5/53/RWS_Tarot_16_Tower.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/9/9b/RWS_Tarot_07_Chariot.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/d/db/RWS_Tarot_06_Lovers.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/690px-RWS_Tarot_02_High_Priestess.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/d/de/RWS_Tarot_01_Magician.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/d/de/RWS_Tarot_01_Magician.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/d/de/RWS_Tarot_01_Magician.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/d/de/RWS_Tarot_01_Magician.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/d/de/RWS_Tarot_01_Magician.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/d/de/RWS_Tarot_01_Magician.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/d/de/RWS_Tarot_01_Magician.jpg',
// 	'https://upload.wikimedia.org/wikipedia/en/d/de/RWS_Tarot_01_Magician.jpg'
// ];

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
	const [gone] = useState(() => new Set()); // The set flags all the cards that are flicked out
	const [props, api] = useSprings(cards.length, i => ({
		to: to(i),
		from: from(i)
	})); // Create a bunch of springs using the helpers above

	// Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity
	const bind = useDrag(
		({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
			const trigger = velocity > 0.2; // If you flick hard enough it should trigger the card to fly out
			const dir = xDir < 0 ? -1 : 1; // Direction should either point left or right
			if (!down && trigger) gone.add(index); // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
			api.start(i => {
				if (index !== i) return; // We're only interested in changing spring-data for the current spring
				const isGone = gone.has(index);
				const x = 0; // When a card is gone it flys out left or right, otherwise goes back to zero
				const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0); // How much the card tilts, flicking it harder makes it rotate faster
				const scale = down ? 1.1 : 1; // Active cards lift up a bit
				return {
					x,
					y: -40,
					rot,
					scale: 0.8,
					delay: undefined,
					config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 }
				};
			});
		}
	);
	// Now we're just mapping the animated values to our view, that's it. Btw, this component only renders once. :-)
	return (
		<>
			{props.map(({ x, y, rot, scale }, i) => (
				<animated.div className={styles.deck} key={i} style={{ x, y }}>
					{/* This is the card itself, we're binding our gesture to it (and inject its index so we know which is which) */}
					<animated.div
						{...bind(i)}
						style={{
							transform: interpolate([rot, scale], trans),
							backgroundImage: `url(${cards[i]})`
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
