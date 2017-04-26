/* @flow */
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

const dateToUnix = (d, startOrEnd) => {
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

const unixToDate = (secs) => new Date(secs);

class SearchCalendar extends Component {
  static contextTypes = {
    canRefine: PropTypes.func,
    ais: PropTypes.object.isRequired
  }
  constructor(props) {
    super(props);
    this.handleDayClick = this.handleDayClick.bind(this);
    this.updateRefine = this.updateRefine.bind(this);

    this.state = this.props.canRefine ? {
      from: unixToDate(props.currentRefinement.min),
      to: unixToDate(props.currentRefinement.max),
      fromUnix: props.currentRefinement.min,
      toUnix: props.currentRefinement.max,
      isFromPivot: true,
    } : { from: null, to: null, fromUnix: null, toUnix: null, isFromPivot: true }
  }
  componentWillMount(){
    if(this.context.canRefine) this.context.canRefine(this.props.canRefine);
  }
  componentWillReceiveProps(nextProps){
    if(nextProps.currentRefinement){
      this.setState({
        from: nextProps.currentRefinement.min ?
          unixToDate(nextProps.currentRefinement.min) : null,
        to: nextProps.currentRefinement.max ?
          unixToDate(nextProps.currentRefinement.max) : null,
        fromUnix: nextProps.currentRefinement.min,
        toUnix: nextProps.currentRefinement.max
      })
    }
    if(this.context.canRefine) this.context.canRefine(nextProps.canRefine);
  }
  updateRefine(startDate, endDate){
    return this.props.refine({
      min: dateToUnix(startDate, "start"),
      max: dateToUnix(endDate, "end")
    })
  }
  /* Date selection state transformation:
    (Constraint either both from, to are null or both Date objects, Constraint from < to)

    {from: null, to: null} & Click date d => {from: d, to: d}
    {from: d, to: d} & Click date d => {from: null, to: null}
    {from: d, to: d} & Click date d1 != d => d1 < d ? {from: d1, to: d} : {from: d, to: d1}
    {from: d1, to: d2} & Click date d => isFromPivot ? (d < d1 ? {from: d, to: d1} : {from: d1, to: d}) : (d < d2 ? {from: d, to: d2} : {from: d2, to: d})
  */
  handleDayClick(clickedDate) {
    const { from, to, isFromPivot } = this.state;
    let nextState;
    if((from === null && to === null) || this.isReset)
      nextState = { from: clickedDate, to: clickedDate, fromUnix: dateToUnix(clickedDate), toUnix: dateToUnix(clickedDate) };
    else if(DateUtils.isSameDay(from, to)){
      if(DateUtils.isSameDay(clickedDate, from)){
        nextState = { from: null, to: null, fromUnix: null, toUnix: null, isFromPivot: true }
      }
      else if(clickedDate < from){
        nextState = { from: clickedDate, fromUnix: dateToUnix(clickedDate), isFromPivot: true }
      }
      else if(clickedDate >= from){
        nextState = { to: clickedDate, toUnix: dateToUnix(clickedDate), isFromPivot: true }
      }
    }
    else {
      if(isFromPivot){
        if(clickedDate < from){
          nextState = { from: clickedDate, fromUnix: dateToUnix(clickedDate), to: from, toUnix: dateToUnix(from) };
        }
        else {
          nextState = { to: clickedDate, toUnix: dateToUnix(clickedDate) };
        }
      }
      else {
        if(clickedDate < to){
          nextState = { from: clickedDate, fromUnix: dateToUnix(clickedDate) };
        }
        else {
          nextState = { from: to, fromUnix: dateToUnix(to), to: clickedDate, toUnix: dateToUnix(clickedDate) };
        }
      }
    }

    const completeNextState = Object.assign({}, this.state, nextState);
    this.setState(nextState);
    this.updateRefine(completeNextState.from, completeNextState.to);
  }
  get isReset(){
    return this.state.fromUnix === this.props.min && this.state.toUnix === this.props.max;
  }
  render(){
    const daysWithContent = !this.context.ais.store.getState().results ? [] :
      this.context.ais.store.getState().results.hits
        .filter(hit => hit.date_starting)
        .map(hit => unixToDate(hit.date_starting));
    console.log(daysWithContent);
    const { from, to } = this.state;
    const { getLocale, refine } = this.props;
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
          modifiers={{
            hasCard: daysWithContent
          }}
          selectedDays={ !this.isReset ? [from, { from, to }] : () => false }
          onDayClick={ this.handleDayClick }
          // disabledDays={ day => day < now }
        />
        <a onClick={() => refine({min: null, max: null})}>
          Reset
        </a>
      </div>
    );
  }
}


export default connectRange(SearchCalendar);
