import React, { Fragment} from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from './redux'
import './index.css';

let initialState = {
  number: 0
}
const INCREMENT = 'INCREMENT'

function reducer(state=initialState, action){
  switch (action.type) {
    case INCREMENT:
       return { number: state.number + 1 }
    default:
        return state
  }
}

// 日志中间就是在状态变化的前后打印日志
let logger = store => next => action => {
  console.log('%c prev state',`color:#A3A3A3,font-weight:bold`,store.getState());
  console.log('%c action',`color:#7FBEDF,font-weight:bold`,action);
  next(action);
  console.log('%c next state',`color:#9CD69B,font-weight:bold`,store.getState());
}
// 处理promise action
let promise = store => next => action => {
    if(action.then && typeof action.then === 'function'){
        return action.then(store.dispatch);
    }
    next(action);
}
// 处理action function
let thunk = store => next => action => {
    if(typeof action === 'function'){
        return action(store.dispatch,store.getState);
    }
    next(action);
}

const { connect, Provider } = applyMiddleware(thunk, promise, logger)(createStore)(reducer,initialState)

// 计数器组件
function Counter(props) {
  return (
    <Fragment>
      <p>{ props.number }</p>
      <button onClick={props.add}>+</button>
      <button onClick={props.thunkAdd}>thunkAdd+</button>
      <button onClick={props.promiseAdd}>promiseAdd+</button>
    </Fragment>
  )
}

const mapStateToProps = state => state
const mapDispatchToProps = dispatch => ({
  add(){
    dispatch({ type: INCREMENT })
  },
  thunkAdd(){
    dispatch(function(dispatch, getState){
        setTimeout(() => {
            dispatch({ type: INCREMENT })
        }, 1000)
    })
  },
  promiseAdd(){
      dispatch(new Promise(function(resolve,reject){
        setTimeout(() => {
              resolve({ type: INCREMENT })
          }, 1000)
      }))
  }
})

const App = connect(mapStateToProps, mapDispatchToProps)(Counter)

ReactDOM.render(
  <Provider>
    <App />
  </Provider>, document.getElementById('root'));
