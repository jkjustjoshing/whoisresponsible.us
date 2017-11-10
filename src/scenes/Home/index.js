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

import type {Geography, Category} from '../../types.js'

import data from '../../resources/aggregate-by-country.json'
import './styles.css'

type State = {
  activeSubcategories: string[],
  hoveredPrimaryName?: string,
  hoveredSecondaryName?: string,
  isShowingAll: boolean,
  isShowingParis: boolean,
  isSortedNegative: boolean,
  primaryGeography?: Geography,
  secondaryGeography?: Geography
}

export default class App extends Component<{}, State> {
  state = {
    activeSubcategories: [],
    hoveredPrimaryName: undefined,
    hoveredSecondaryName: undefined,
    isShowingAll: false,
    isShowingParis: false,
    isSortedNegative: false,
    primaryGeography: undefined,
    secondaryGeography: undefined
  }

  handleCategoryClick = (category: Category) => () => {
    const {activeSubcategories} = this.state
    const newActiveSubcategories = category.subcategories.every(s =>
      activeSubcategories.includes(s)
    )
      ? activeSubcategories.filter(
          s => !category.subcategories.find(sc => sc === s)
        )
      : activeSubcategories.concat(
          category.subcategories
            .map(s => s)
            .filter(s => !activeSubcategories.includes(s))
        )
    this.setState((state: State) => ({
      activeSubcategories: newActiveSubcategories
    }))
  }

  handleSubcategoryClick = (sub: string) => () => {
    const {activeSubcategories} = this.state
    const newActiveSubcategories = activeSubcategories.includes(sub)
      ? this.state.activeSubcategories.filter(s => s !== sub)
      : [sub].concat(this.state.activeSubcategories)
    this.setState((state: State) => ({
      activeSubcategories: newActiveSubcategories
    }))
  }

  handleGeographyClick = (geography: Geography) => {
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

    this.setState((state: State) => newState)
  }

  handleGeographyMouseEnter = (geography: Geography) => {
    this.setState((state: State) => ({
      hoveredPrimaryName: state.primaryGeography
        ? undefined
        : geography.properties.name_long,
      hoveredSecondaryName:
        state.primaryGeography && state.secondaryGeography
          ? undefined
          : state.primaryGeography ? geography.properties.name_long : undefined
    }))
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
      hoveredPrimaryName,
      hoveredSecondaryName,
      isShowingAll,
      isShowingParis,
      isSortedNegative,
      primaryGeography,
      secondaryGeography
    } = this.state

    return (
      <div className="app">
        <Header
          primaryName={
            primaryGeography && primaryGeography.properties.name_long
          }
          secondaryName={
            secondaryGeography && secondaryGeography.properties.name_long
          }
          hoveredPrimaryName={hoveredPrimaryName}
          hoveredSecondaryName={hoveredSecondaryName}
          isShowingAll={isShowingAll}
          isSortedNegative={isSortedNegative}
          onPrimaryClick={this.handlePrimaryClick}
          onSecondaryClick={this.handleSecondaryClick}
        />
        <div className="app__body">
          <div className="app__container">
            <Map
              onGeographyClick={this.handleGeographyClick}
              onGeographyMouseEnter={this.handleGeographyMouseEnter}
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
            />
            {primaryGeography &&
              secondaryGeography && (
                <Categories
                  onCategoryClick={this.handleCategoryClick}
                  onSubcategoryClick={this.handleSubcategoryClick}
                  onParisClick={this.handleParisClick}
                  activeSubcategories={activeSubcategories}
                  isShowingParis={isShowingParis}
                />
              )}
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
                {!!activeSubcategories.length && (
                  <Comparisons
                    activeSubcategories={activeSubcategories}
                    primaryCode={primaryGeography.properties.iso_a3}
                    secondaryCode={secondaryGeography.properties.iso_a3}
                    onTopSort={this.handleTopSort}
                    isSortedNegative={isSortedNegative}
                    isShowingAll={isShowingAll}
                    isShowingParis={isShowingParis}
                  />
                )}
              </div>
            )}
        </div>
        <Footer />
      </div>
    )
  }
}