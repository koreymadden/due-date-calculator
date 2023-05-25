import React, { useEffect, useState } from 'react';
import Holidays from 'date-holidays';
import './App.css';
import Clock from './components/Clock';

function App() {
	const [currentDueDate, setCurrentDueDate] = useState<Date>();
	const [timeError, setTimeError] = useState(false);
	const [weekdayError, setWeekdayError] = useState(false);
	const [holidayError, setHolidayError] = useState(false);

	useEffect(() => {
		console.warn(calculateDueDate(new Date('May 24, 2023 13:15:05'), 21));
		// console.warn(calculateDueDate(new Date(), 17));
	}, []);

	const calculateDueDate = (
		submitDate: Date = new Date(),
		turnAroundHours: number
	) => {
		// tickets can only be reported between 9AM to 5PM
		const validSubmitTime = isTimeValid(submitDate);

		// tickets can only be reported between monday and friday
		const validWeekDay = isWeekdayValid(submitDate);

		// tickets cannot be reported on holidays
		const validNonHoliday = isNotHoliday(submitDate);

		if (validSubmitTime && validWeekDay && validNonHoliday) {
			resetErrors();
			const dueDate = determineDueDate(submitDate, turnAroundHours);
			setCurrentDueDate(dueDate);
			return dueDate;
		} else {
			setTimeError(!validSubmitTime);
			setWeekdayError(!validWeekDay);
			setHolidayError(!validNonHoliday);
			return new Error(
				'[INVALID SUBMIT DATE]: You can only submit an issue between 9AM - 5PM, Monday to Friday, and not on holidays.'
			);
		}
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

	const isNotHoliday = (submitDate: Date) => {
		const unitedStatesHolidays = new Holidays('US');
		return !unitedStatesHolidays.isHoliday(submitDate);
	};

	const determineDueDate = (submitDate: Date, turnAroundHours: number) => {
		const DAY_IN_MS = 86400000;
		const HOUR_IN_MS = 3600000;
		const additionalDays = Math.floor(turnAroundHours / 8);
		const additionalHours = turnAroundHours % 8;

		// time in ms since jan 1, 1970
		const submitDateTime = submitDate.getTime();

		// time in ms that need is needed to get job done
		const timeNeeded =
			additionalDays * DAY_IN_MS + additionalHours * HOUR_IN_MS;

		// add the turnaround time that is needed to the submitted date's time to get the due date
		let dueDate = submitDateTime + timeNeeded;

		// validate due date to make sure the new date is not on a holiday, not a weekend, and not a holiday
		while (
			!isNotHoliday(new Date(dueDate)) ||
			!isWeekdayValid(new Date(dueDate)) ||
			!isTimeValid(new Date(dueDate))
		) {
			while (
				!isWeekdayValid(new Date(dueDate)) ||
				!isNotHoliday(new Date(dueDate))
			) {
				// the current date is either on the weekend or a holiday so we need to change the date by one day
				dueDate = dueDate + DAY_IN_MS;
			}

			while (!isTimeValid(new Date(dueDate))) {
				// the time is not between 9AM and 5PM so we need to change the day and add the remaining time to the start of the workday
				const timePassedSinceWorkday = getTimePassedSinceWorkday(
					new Date(dueDate)
				);
				const newDate = new Date(dueDate + DAY_IN_MS);
				newDate.setHours(9, 0, 0, 0);
				const endDate = new Date(newDate.getTime() + timePassedSinceWorkday);
				dueDate = endDate.getTime();
			}
		}

		return new Date(dueDate);
	};

	function getTimePassedSinceWorkday(date: Date) {
		const targetDate = new Date(date);
		targetDate.setHours(17, 0, 0, 0);
		if (targetDate.getTime() > date.getTime()) {
			targetDate.setDate(targetDate.getDate() - 1);
		}
		const timeSince5 = date.getTime() - targetDate.getTime();
		return timeSince5;
	}

	const resetErrors = () => {
		setTimeError(false);
		setWeekdayError(false);
		setHolidayError(false);
	};

	return (
		<div className='App'>
			<div>This project does not interact with the user interface.</div>
			<Clock />
			{currentDueDate && (
				<div className='due-date'>
					Due Date: {currentDueDate.toDateString()} at{' '}
					{currentDueDate.toLocaleTimeString()}
				</div>
			)}
			{timeError && (
				<div className='error'>
					You can only submit an issue between 9AM and 5PM.
				</div>
			)}
			{weekdayError && (
				<div className='error'>
					You can only submit an issue on Monday to Friday.
				</div>
			)}
			{holidayError && (
				<div className='error'>You cannot submit an issue on a US holiday.</div>
			)}
		</div>
	);
}

export default App;
