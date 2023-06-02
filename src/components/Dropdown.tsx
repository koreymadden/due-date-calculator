import React, { useState } from 'react';

interface DropdownProps {
	morningNight: 'AM' | 'PM';
	setAmPm: React.Dispatch<React.SetStateAction<'AM' | 'PM'>>;
}

const Dropdown = ({ morningNight, setAmPm }: DropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedOption, setSelectedOption] = useState(morningNight);

	const options: DropdownProps['morningNight'][] = ['AM', 'PM'];

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const selectOption = (option: DropdownProps['morningNight']) => {
		setSelectedOption(option);
		setAmPm(option);
		setIsOpen(false);
	};

	return (
		<div className='input-div dropdown'>
			<label className='date-time-label'>AM/PM</label>
			<div className='date-time-input styled-dropdown' onClick={toggleDropdown}>
				<span className='selected-option'>{selectedOption}</span>
				{isOpen && (
					<ul className='options-list'>
						{options.map((option, index) => (
							<li
								className='option'
								key={index}
								onClick={() => selectOption(option)}
							>
								{option}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default Dropdown;
