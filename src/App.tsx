import React, { useEffect } from 'react';
import './App.css';
import Clock from './components/Clock';

function App() {
	useEffect(() => {
		calculateDueDate(new Date('May 24, 2023 13:15:05'), 21);
		// calculateDueDate(new Date(), 17);
	}, []);

	const calculateDueDate = (
		submitDate: Date = new Date(),
		turnAroundHours: number
	) => {
		// tickets can only be reported between 9AM to 5PM
		console.log('isTimeValid:', isTimeValid(submitDate));
		// tickets can only be reported between monday and friday
		console.log('isWeekdayValid:', isWeekdayValid(submitDate));
		// tickets cannot be reported on holidays
		console.log('isHoliday:', isHoliday(submitDate));
		// determine due date
		console.warn(
			'determineDueDate:',
			determineDueDate(submitDate, turnAroundHours)
		);
	};

	const isTimeValid = (submitDate: Date) => {
		const submitHour = submitDate.getHours();
		const invalidDate =
			submitHour === 17 &&
			(submitDate.getMinutes() > 0 ||
				submitDate.getSeconds() > 0 ||
				submitDate.getMilliseconds() > 0);
		return invalidDate ? false : submitHour >= 9 && submitHour <= 17;
	};

	const isWeekdayValid = (submitDate: Date) => {
		const day = submitDate.getDay();
		return day >= 1 && day <= 5;
	};

	const isHoliday = (submitDate: Date) => {
		return false;
	};

	const determineDueDate = (submitDate: Date, turnAroundHours: number) => {
		const additionalDays = Math.floor(turnAroundHours / 8);
		const additionalHours = turnAroundHours % 8;

		return changeDate(submitDate, additionalDays, additionalHours);
	};

	const changeDate = (
		submitDate: Date,
		additionalDays: number,
		additionalHours: number
	) => {
		const DAY_IN_MS = 86400000;
		const HOUR_IN_MS = 3600000;

		// ms since 1970
		let dueDate = submitDate.getTime();

		// time in ms that need is needed to get job done
		const timeToAdd = additionalDays * DAY_IN_MS;
		const moreTimeToAdd = additionalHours * HOUR_IN_MS;

		// add ms to the submitted time from days that need to be added
		dueDate = dueDate + timeToAdd + moreTimeToAdd;

		while (
			isHoliday(new Date(dueDate)) ||
			!isWeekdayValid(new Date(dueDate)) ||
			!isTimeValid(new Date(dueDate))
		) {
			// determine if the day of the week is valid from the added ms
			while (
				!isWeekdayValid(new Date(dueDate)) ||
				isHoliday(new Date(dueDate))
			) {
				console.debug('DAY OF WEEK IS NOT VALID');
				dueDate = dueDate + DAY_IN_MS;
			}

			// determine if the new time is before 9AM or after 5PM
			while (!isTimeValid(new Date(dueDate))) {
				console.debug('TIME IS NOT VALID');
				// create date object at the same time but the next day
				const timeSince9ToAdd = getTimePassedSince5PM(new Date(dueDate));
				let newDate = new Date(dueDate + DAY_IN_MS);
				newDate.setHours(9, 0, 0, 0);
				const finalDate = new Date(newDate.getTime() + timeSince9ToAdd);
				dueDate = finalDate.getTime();
			}
		}
		return new Date(dueDate);
	};

	function getTimePassedSince5PM(date: Date) {
		const targetDate = new Date(date);
		targetDate.setHours(17, 0, 0, 0);

		if (targetDate.getTime() > date.getTime()) {
			targetDate.setDate(targetDate.getDate() - 1);
		}

		const timeSince5 = date.getTime() - targetDate.getTime();

		return timeSince5;
	}

	return (
		<div className='App'>
			<div>This project does not interact with the user interface.</div>
			<Clock />
		</div>
	);
}

export default App;
