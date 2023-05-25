import React, { useEffect, useState } from 'react';

const Clock = () => {
	const [time, setTime] = useState(new Date());

	useEffect(() => {
		const timer = setInterval(() => {
			const options = { timeZone: 'America/New_York' };
			const estTime = new Date().toLocaleString('en-US', options);
			setTime(new Date(estTime));
		}, 1000);

		return () => {
			clearInterval(timer);
		};
	}, []);
	return <div>{time.toLocaleTimeString()}</div>;
};

export default Clock;
