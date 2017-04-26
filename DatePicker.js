import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connectRange } from 'react-instantsearch/connectors';
import ResetCalendar from './ResetCalendar';
import DayPicker, { DateUtils } from 'react-day-picker';
import MomentLocaleUtils from 'react-day-picker/moment';

const LABELS = {
  nl: { nextMonth: 'Volgende maand', previousMonth: 'Vorige maand' },
  en: { nextMonth: 'Next Month', previousMonth: 'Previous Month'}
};

const setToStartOfDay = (d) => {
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

const setToEndOfDay = (d) => {
  d.setHours(23);
  d.setMinutes(59);
  d.setSeconds(59);
  d.setMilliseconds(999);
  return d;
}

class SearchCalendar extends Component {
  static contextTypes = {
    canRefine: PropTypes.func,
  }
  constructor(props) {
    super(props);
    this.handleDayClick = this.handleDayClick.bind(this);
    this.updateRefine = this.updateRefine.bind(this);
    this.unixToDate = this.unixToDate.bind(this);
    this.dateToUnix = this.dateToUnix.bind(this);

    this.state = this.props.canRefine ? {
      from: this.unixToDate(props.currentRefinement.min),
      to: this.unixToDate(props.currentRefinement.max),
      fromUnix: props.currentRefinement.min,
      toUnix: props.currentRefinement.max
    } : { from: null, to: null, fromUnix: null, toUnix: null }
  }
  componentWillMount(){
    if(this.context.canRefine) this.context.canRefine(this.props.canRefine);
  }
  componentWillReceiveProps(nextProps){
    if(nextProps.currentRefinement){
      this.setState({
        from: nextProps.currentRefinement.min ?
          this.unixToDate(nextProps.currentRefinement.min) : null,
        to: nextProps.currentRefinement.max ?
          this.unixToDate(nextProps.currentRefinement.max) : null,
        fromUnix: nextProps.currentRefinement.min,
        toUnix: nextProps.currentRefinement.max
      })
    }
    if(this.context.canRefine) this.context.canRefine(nextProps.canRefine);
  }
  unixToDate(secs){
    return new Date(secs);
  }
  dateToUnix(d, startOrEnd){
    let newDate = new Date(d);
    if(startOrEnd === "start"){
      setToStartOfDay(newDate);
      return newDate.getTime();
    }
    else if(startOrEnd === "end") {
      setToEndOfDay(newDate);
      return newDate.getTime();
    }
  }
  updateRefine(startDate, endDate){
    return this.props.refine({
      min: this.dateToUnix(startDate, "start"),
      max: this.dateToUnix(endDate, "end")
    })
  }
  handleDayClick(dayDate) {
    let range = DateUtils.addDayToRange(dayDate, this.state);
    if(range.to && !range.from) range = {from: range.to, to: range.to};
    else if(range.to && range.from && range.to < range.from) range = {to: range.from, from: range.to};
    else if(range.from && !range.to) range = { from: range.from, to: range.from };
    this.updateRefine(range.from, range.to);
    range.fromUnix = this.dateToUnix(range.from);
    range.toUnix = this.dateToUnix(range.to);
    this.setState(range);
  }
  render(){
    const { from, to, fromUnix, toUnix } = this.state;
    const { min, max, getLocale, refine } = this.props;
    const isReset = fromUnix === min && toUnix === max;
    const now = new Date();
    setToStartOfDay(now);
    const locale = getLocale();
    return (
      <div>
        <DayPicker
          labels={ LABELS[locale] }
          locale={ locale }
          localeUtils={ MomentLocaleUtils }
          initialMonth={ new Date() }
          numberOfMonths={ 1 }
          selectedDays={ !isReset ? [from, { from, to }] : () => false }
          onDayClick={ this.handleDayClick }
          disabledDays={ day => day < now }
        />
        <ResetCalendar setReset={() => refine({min: null, max: null})} />
      </div>
    );
  }
}


export default connectRange(SearchCalendar);
