// @flow
import React, {Component} from 'react'

import {
  Categories,
  Comparisons,
  Controls,
  Footer,
  Header,
  Map
} from '../../components'

import withRedux from 'next-redux-wrapper'
import {initStore} from '../../store'
// TODO: Abstract into component
import {Tooltip, actions as tooltipActions} from 'redux-tooltip'
import type {Geography, Category} from '../../types.js'

import data from '../../resources/aggregate-by-country.json'
import './styles.css'

const LIMIT = Infinity

type State = {
  activeSubcategories: string[],
  isShowingAll: boolean,
  isShowingParis: boolean,
  isSortedNegative: boolean,
  primaryGeography?: Geography,
  secondaryGeography?: Geography,
  clicktime: Date
}

type Props = {
  dispatch: *
}
class App extends Component<Props, State> {
  state = {
    activeSubcategories: [],
    isPaused: false,
    isShowingAll: false,
    isShowingParis: false,
    isSortedNegative: false,
    primaryGeography: undefined,
    secondaryGeography: undefined,
    clicktime: new Date()
  }

  handleCategoryClick = (category: Category) => () => {
    const {activeSubcategories} = this.state
    const newActiveSubcategories = category.subcategories.every(s =>
      activeSubcategories.includes(s)
    )
      ? activeSubcategories.filter(
          s => !category.subcategories.find(sc => sc === s)
        )
      : category.subcategories
          .map(s => s)
          .filter(s => !activeSubcategories.includes(s))
          .concat(activeSubcategories)
    this.setState((state: State) => ({
      activeSubcategories: newActiveSubcategories
    }))
  }

  handleSubcategoryClick = (sub: string) => () => {
    const {activeSubcategories} = this.state
    const newActiveSubcategories = activeSubcategories.includes(sub)
      ? this.state.activeSubcategories.filter(s => s !== sub)
      : [sub].concat(this.state.activeSubcategories.slice(0, LIMIT - 1))
    this.setState((state: State) => ({
      activeSubcategories: newActiveSubcategories
    }))
  }

  handleGeographyClick = (geography: Geography, evt: window.Event) => {
    evt.stopPropagation()
    if (!this.canClick()) return
    const newState = {}

    if (this.state.primaryGeography) {
      if (
        geography.properties.iso_a3 ===
        this.state.primaryGeography.properties.iso_a3
      ) {
        newState.primaryGeography = undefined
      } else if (
        this.state.secondaryGeography &&
        geography.properties.iso_a3 ===
          this.state.secondaryGeography.properties.iso_a3
      ) {
        newState.secondaryGeography = undefined
      } else {
        newState.secondaryGeography = geography
      }
    } else {
      newState.primaryGeography = geography
    }
    const x = evt.clientX + window.pageXOffset
    const y = evt.clientY + window.pageYOffset

    this.setState(
      (state: State) => newState,
      () => {
        if (this.state.primaryGeography && this.state.secondaryGeography) {
          this.props.dispatch(tooltipActions.hide())
        } else {
          this.props.dispatch(
            tooltipActions.show({
              origin: {x, y},
              content: 'Pick a second country'
            })
          )
        }
      }
    )
  }

  canClick = () => {
    const {clicktime} = this.state
    if (!clicktime) return false
    if (new Date() - clicktime < 500) return false
    this.setState((state: State) => ({clicktime: new Date()}))
    return true
  }

  handleClearGeography = () => {
    const newState = {
      primaryGeography: undefined,
      secondaryGeography: undefined,
      isShowingAll: false
    }
    this.setState((state: State) => newState)
  }

  handleAllToggle = () => {
    this.setState((state: State) => ({
      isShowingAll: !state.isShowingAll
    }))
  }

  handleTopSort = () => {
    this.setState((state: State) => ({
      isSortedNegative: !state.isSortedNegative
    }))
  }

  handlePrimaryClick = () => {
    this.setState((state: State) => ({
      primaryGeography: undefined
    }))
  }

  handleSecondaryClick = () => {
    this.setState((state: State) => ({
      secondaryGeography: undefined
    }))
  }

  handleParisClick = () => {
    this.setState((state: State) => ({
      isShowingParis: !state.isShowingParis
    }))
  }

  getScale = (code: string) => {
    const {activeSubcategories} = this.state

    if (!activeSubcategories || !activeSubcategories.length || !data[code])
      return null

    return (
      activeSubcategories.reduce((m, sc) => {
        return m + data[code][sc.toLowerCase()] || 0
      }, 0) / activeSubcategories.length
    )
  }

  render() {
    const {
      activeSubcategories,
      isShowingAll,
      isShowingParis,
      isSortedNegative,
      primaryGeography,
      secondaryGeography
    } = this.state

    return (
      <div className="app">
        <Tooltip
          className={
            isShowingAll
              ? 'app__tooltip--all'
              : !primaryGeography
                ? 'app__tooltip--primary'
                : 'app__tooltip--secondary'
          }
        />
        <Header
          primaryName={primaryGeography && primaryGeography.properties.name}
          secondaryName={
            secondaryGeography && secondaryGeography.properties.name
          }
          isShowingAll={isShowingAll}
          isSortedNegative={isSortedNegative}
          onPrimaryClick={this.handlePrimaryClick}
          onSecondaryClick={this.handleSecondaryClick}
        />
        <div className="app__body">
          <div className="app__container">
            <Map
              onGeographyClick={this.handleGeographyClick}
              activeSubcategories={activeSubcategories}
              primaryCode={
                primaryGeography
                  ? primaryGeography.properties.iso_a3
                  : undefined
              }
              secondaryCode={
                secondaryGeography
                  ? secondaryGeography.properties.iso_a3
                  : undefined
              }
              isShowingAll={isShowingAll}
              // pause={this.handlePause}
            />

            <Categories
              onCategoryClick={this.handleCategoryClick}
              onSubcategoryClick={this.handleSubcategoryClick}
              onParisClick={this.handleParisClick}
              activeSubcategories={activeSubcategories}
              isShowingParis={isShowingParis}
              isShowing={!!primaryGeography && !!secondaryGeography}
            />
          </div>
          {primaryGeography &&
            secondaryGeography && (
              <div className="app__details">
                <Controls
                  onBackClick={this.handleClearGeography}
                  onAllToggle={this.handleAllToggle}
                  isShowingAll={isShowingAll}
                  hasActiveSubcategories={!!activeSubcategories.length}
                />
                <Comparisons
                  activeSubcategories={activeSubcategories}
                  primaryCode={primaryGeography.properties.iso_a3}
                  secondaryCode={secondaryGeography.properties.iso_a3}
                  onTopSort={this.handleTopSort}
                  isSortedNegative={isSortedNegative}
                  isShowingAll={isShowingAll}
                  isShowingParis={isShowingParis}
                  isVisible={!!activeSubcategories.length}
                />
              </div>
            )}
        </div>
        <Footer />
      </div>
    )
  }
}

export default withRedux(initStore)(App)
