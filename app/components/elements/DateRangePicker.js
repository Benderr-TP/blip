import React, { useState } from 'react';
import momentPropTypes from 'react-moment-proptypes';
import { DateRangePicker as DateRangePickerBase, DateRangePickerShape } from 'react-dates';
import ArrowRightAltRoundedIcon from '@material-ui/icons/ArrowRightAltRounded';
import NavigateBeforeRoundedIcon from '@material-ui/icons/NavigateBeforeRounded';
import NavigateNextRoundedIcon from '@material-ui/icons/NavigateNextRounded';
import CloseRoundedIcon from '@material-ui/icons/CloseRounded';
import omit from 'lodash/omit';
import noop from 'lodash/noop';
import styled from 'styled-components';

import { StyledDatePickerBase } from './DatePicker';

import {
  colors,
  radii,
  shadows,
  space,
} from '../../themes/baseTheme';

const StyledDateRangePicker = styled(StyledDatePickerBase)`
  .DateRangePickerInput {
    border-radius: ${radii.input}px;
    border-color: ${colors.borderColor};
  }

  .DateRangePicker_picker {
    box-shadow: ${shadows.small};
    margin-top: ${space[3]}px;
  }

  .DateRangePickerInput_clearDates {
    padding: 0;
    display: flex;

    .MuiSvgIcon-root {
      width: 20px;
    }
  }

  .DateRangePickerInput_arrow {
    padding: 0;
    display: inline-flex;
  }

  .CalendarDay {
    &.CalendarDay__selected_start,
    &.CalendarDay__selected_start:active,
    &.CalendarDay__selected_start:hover {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    &.CalendarDay__selected_end,
    &.CalendarDay__selected_end:active,
    &.CalendarDay__selected_end:hover {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    &.CalendarDay__hovered_span,
    &.CalendarDay__hovered_span:hover,
    &.CalendarDay__selected_span,
    &.CalendarDay__selected_span:active,
    &.CalendarDay__selected_span:hover {
      background: ${colors.lightPurple};
      border-radius: 0;
    }
  }
`;

export const DateRangePicker = (props) => {
  const [dates, setDates] = useState({
    startDate: props.initialStartDate,
    endDate: props.initialEndDate,
  });
  const [focusedInput, setFocusedInput] = useState(props.initialFocusedInput);

  return (
    <StyledDateRangePicker>
      <DateRangePickerBase
        {...omit(props, [
          'initialStartDate',
          'initialEndDate',
          'initialFocusedInput',
        ])}
        startDate={dates.startDate}
        startDateId={props.startDateId}
        endDate={dates.endDate}
        endDateId={props.endDateId}
        onDatesChange={dates => setDates(dates) && props.onDatesChange(dates)}
        focusedInput={focusedInput}
        onFocusChange={focusedInput => setFocusedInput(focusedInput) && props.onFocusChange(focusedInput)}
        numberOfMonths={2}
        displayFormat='MMM D, YYYY'
        verticalSpacing={0}
        navNext={<NavigateNextRoundedIcon />}
        navPrev={<NavigateBeforeRoundedIcon />}
        customCloseIcon={<CloseRoundedIcon />}
        customArrowIcon={<ArrowRightAltRoundedIcon />}
        isOutsideRange={props.isOutsideRange}
        enableOutsideDays={props.enableOutsideDays}
        daySize={36}
        hideKeyboardShortcutsPanel
        showClearDates
      />
    </StyledDateRangePicker>
  );
}

DateRangePicker.propTypes = {
  ...DateRangePickerShape,
  initialStartDate: momentPropTypes.momentObj,
  initialEndDate: momentPropTypes.momentObj,
  initialFocusedInput: DateRangePickerShape.focusedInput,
};

DateRangePicker.defaultProps = {
  initialStartDate: null,
  initialEndDate: null,
  initialFocusedInput: null,
  onDatesChange: noop,
  onFocusChange: noop,
  isOutsideRange: noop,
}

export default DateRangePicker;
