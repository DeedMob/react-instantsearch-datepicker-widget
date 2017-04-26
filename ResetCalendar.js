/* @flow */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connectCurrentRefinements } from 'react-instantsearch/connectors';

export type Props = {
  items: Array<{ label?: string }>,
  refine: Function,
  canRefine: boolean,
  transformItems?: Function,
};

class ResetCalendar extends Component {
  props: Props;
  static contextTypes = {
    canRefine: PropTypes.func
  }

  componentWillMount(){
    if(this.context.canRefine) this.context.canRefine(this.props.canRefine);
  }
  componentWillReceiveProps(props){
    if(this.context.canRefine) this.context.canRefine(props.canRefine);
  }
  render(){
    const {items, refine} = this.props;

    return (
      <div>
        {items.map(item =>
          <div key={item.label}>
            <center>
              <a
                href="."
                onClick={(e) => {
                  e.preventDefault();
                  this.props.setReset(true);
                  return refine.bind(null, item.value)();
                }}
              >
                Reset
              </a>
            </center>
          </div>
        )}
      </div>
    )
  }
}

export default connectCurrentRefinements(ResetCalendar);
