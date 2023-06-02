import React, { useEffect, useState } from 'react';
import Holidays from 'date-holidays';
import './App.css';
import Clock from './components/Clock';
import Divider from './components/Divider';
import Dropdown from './components/Dropdown';

function App() {
	const [currentDueDate, setCurrentDueDate] = useState<Date>();
	const [timeError, setTimeError] = useState(false);
	const [weekdayError, setWeekdayError] = useState(false);
	const [holidayError, setHolidayError] = useState(false);

	const [year, setYear] = useState<number>(2023);
	const [month, setMonth] = useState(2);
	const [day, setDay] = useState(26);
	const [hour, setHour] = useState(10);
	const [minutes, setMinutes] = useState(30);
	const [userTurnAround, setUserTurnAround] = useState(8);
	const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');

	const validateUserDateTime = (
		userYear: number,
		userMonth: number,
		userDay: number,
		userHour: number,
		userMinutes: number,
		userAmPm: string
	) => {
		if (userYear < 1970) return;
		if (userMonth < 1 || userMonth > 12) return;
		if (userDay < 1 || userDay > 31) return;
		if (userHour < 1 || userHour > 12) return;
		if (userMinutes < 0 || userMinutes > 59) return;
		if (userTurnAround < 1) return;

		calculateDueDate(
			new Date(
				userYear,
				userMonth - 1,
				userDay,
				userAmPm === 'PM' ? userHour + 12 : userHour,
				userMinutes
			),
			userTurnAround
		);
	};

	const calculateDueDate = (
		submitDate: Date = new Date(),
		turnAroundHours: number
	) => {
		// convert submitted date to eastern time zone
		const timeZoneDate = convertToTimeZone(submitDate);

		// tickets can only be reported between 9AM to 5PM
		const validSubmitTime = isTimeValid(timeZoneDate);

		// tickets can only be reported between monday and friday
		const validWeekDay = isWeekdayValid(timeZoneDate);

		// tickets cannot be reported on holidays
		const validNonHoliday = isNotHoliday(timeZoneDate);

		if (validSubmitTime && validWeekDay && validNonHoliday) {
			resetErrors();
			const dueDate = determineDueDate(timeZoneDate, turnAroundHours);
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
		// const unitedStatesHolidays = new Holidays('US');
		// return !unitedStatesHolidays.isHoliday(submitDate);

		// month 0 - 11
		const month = submitDate.getMonth();

		// day 1 - 31
		const day = submitDate.getDate();

		// day of week 0 - 6
		const dayOfWeek = submitDate.getDay();

		// memorial day
		if (month === 4 && day >= 25 && dayOfWeek === 1) {
			return false;
		}

		// independence day
		if (month === 6 && day === 4) {
			return false;
		}

		// labor day
		if (month === 8 && day <= 7 && dayOfWeek === 1) {
			return false;
		}

		// thanksgiving
		if (month === 10 && dayOfWeek === 4 && Math.floor((day - 1) / 7) === 3) {
			return false;
		}

		// christmas
		if (month === 11 && day === 25) {
			return false;
		}

		// new years
		if (month === 0 && day === 1) {
			return false;
		}

		return true;
	};

	const convertToTimeZone = (submitDate: Date) => {
		const options = { timeZone: 'America/New_York' };
		const estDateTime = submitDate.toLocaleString('en-US', options);
		return new Date(estDateTime);
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
			<Clock />
			<Divider />
			<div className='input-div turn-around-hours'>
				<label className='date-time-label' htmlFor='user-turn-around-hours'>
					Turn Around Hours
				</label>
				<input
					className='date-time-input'
					id='user-turn-around-hours'
					type='number'
					placeholder='8'
					min='1'
					value={userTurnAround}
					onChange={(e) => setUserTurnAround(Number(e.target.value))}
				/>
			</div>
			<Divider />
			<div className='date-time-fields'>
				<div className='date-fields'>
					<div className='input-div year'>
						<label className='date-time-label' htmlFor='user-year'>
							Year
						</label>
						<input
							className='date-time-input'
							id='user-year'
							type='number'
							placeholder='2023'
							min='1970'
							value={year}
							onChange={(e) => setYear(Number(e.target.value))}
						/>
					</div>
					<div className='input-div month'>
						<label className='date-time-label' htmlFor='user-month'>
							Month
						</label>
						<input
							className='date-time-input'
							id='user-month'
							type='number'
							placeholder='02'
							min='1'
							max='12'
							value={month}
							onChange={(e) => setMonth(Number(e.target.value))}
						/>
					</div>
					<div className='input-div day'>
						<label className='date-time-label' htmlFor='user-day'>
							Day
						</label>
						<input
							className='date-time-input'
							id='user-day'
							type='number'
							placeholder='26'
							min='1'
							max='31'
							value={day}
							onChange={(e) => setDay(Number(e.target.value))}
						/>
					</div>
				</div>
				<div className='time-fields'>
					<div className='input-div hour'>
						<label className='date-time-label' htmlFor='user-hour'>
							Hour
						</label>
						<input
							className='date-time-input'
							id='user-hour'
							type='number'
							placeholder='10'
							min='1'
							max='12'
							value={hour}
							onChange={(e) => setHour(Number(e.target.value))}
						/>
					</div>
					<div className='input-div minutes'>
						<label className='date-time-label' htmlFor='user-minutes'>
							Minutes
						</label>
						<input
							className='date-time-input'
							id='user-minutes'
							type='number'
							placeholder='30'
							min='0'
							max='59'
							value={minutes}
							onChange={(e) => setMinutes(Number(e.target.value))}
						/>
					</div>
					<Dropdown setAmPm={setAmPm} morningNight={amPm} />
				</div>
				<div
					className='time-now'
					onClick={() =>
						validateUserDateTime(year, month, day, hour, minutes, amPm)
					}
				>
					Submit Time
				</div>
			</div>
			<div className='or-line'>
				<div className='or'>OR</div>
			</div>
			<div className='time-now' onClick={() => calculateDueDate(new Date(), 8)}>
				Use Current Time
			</div>
			<Divider />

			{currentDueDate && (
				<div className='due-date'>
					Due Date: {currentDueDate.toDateString()} at{' '}
					{currentDueDate.toLocaleTimeString()}
				</div>
			)}
			{timeError && (
				<div className='error'>
					You can only submit an issue between 9AM and 5PM (EST).
				</div>
			)}
			{weekdayError && (
				<div className='error'>
					You can only submit an issue on Monday to Friday.
				</div>
			)}
			{holidayError && (
				<div className='error'>
					You cannot submit an issue on a U.S. Federal Holiday.
				</div>
			)}
		</div>
	);
}

export default App;
