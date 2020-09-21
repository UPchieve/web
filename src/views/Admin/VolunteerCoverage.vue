<template>
  <div class="volunteer-coverage">
    <div class="header">Volunteer Coverage</div>
    <div class="wrap-container">
      <div class="container-metric">
        <div class="subheader-metric">
          # hours w/ less than
          <form>
            <input
              v-model.number="lessThan"
              placeholder="number"
              class="input"
              type="number"
              :style="{ '--rgb': lessThanColor }"
            />
          </form>
          volunteers
        </div>
        <div class="container-content">
          <div class="metrics-info">
            {{ ((100 / 168) * getNumHours(true)).toFixed(2) }}%
          </div>
          {{ getNumHours(true) }}hrs
        </div>
      </div>

      <div class="container-metric">
        <div class="subheader-metric">
          # hours w/ more than
          <input
            v-model.number="greaterThan"
            placeholder="number"
            class="input"
            type="number"
            :style="{ '--rgb': greaterThanColor }"
          />
          volunteers
        </div>
        <div class="container-content">
          <div class="metrics-info">
            {{ ((100 / 168) * getNumHours(false)).toFixed(2) }}%
          </div>
          {{ getNumHours(false) }}hrs
        </div>
      </div>

      <div class="container">
        <div class="subheader-calendar">Coverage Map</div>
        <div class="container-content">
          <div class="subject-selecter">
            <v-select
              v-model="selected"
              :options="topics"
              @input="getAvailability"
            >
            </v-select>
          </div>
          <div v-show="selected" class="table-layout">
            <div class="subtable--days">
              <div
                class="cell--header--days"
                v-for="day in availabilityTable.daysOfWeek"
                :key="`${day}`"
              >
                {{ day }}
              </div>
            </div>
            <div class="subtable--times">
              <div
                class="cell--header--times"
                v-for="time in availabilityTable.timesOfDay"
                :key="`${time}`"
              >
                {{ time }}
              </div>
            </div>
            <div class="subtable--data">
              <div
                v-for="(cell, index) in availabilityTable.table"
                :key="`${index}`"
              >
                <div
                  class="cell--data"
                  :style="{
                    '--rgb': getColor(cell),
                    '--hour': getGradient(cell)
                  }"
                >
                  {{ cell }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserService from "@/services/UserService";

import { allSubtopicNames } from "@/utils/topics";

export default {
  data() {
    return {
      // colors for calendar heat map
      mainColor: "255, 0, 0",
      lessThanColor: "255, 255, 0", // highlighting color for < metric
      greaterThanColor: "0, 255, 0", // highlighting color for > metric
      lessAndGreaterThanColor: "255, 0, 255", // highlighting color for intersection between < and >
      errorMsg: "",
      // user inputted values
      lessThan: "",
      greaterThan: "",
      // dropdown menu options
      selected: "algebraOne", // default
      topics: allSubtopicNames(),
      // availability objects
      availabilityTable: {}
    };
  },

  created() {
    this.getAvailability(this.selected);
  },

  methods: {
    /* Retrieves a 2d array with column and row headers. Each cell represents
        the number of volunteers available at that day and hour block who are certified
        in the "certifiedSubject". */
    getAvailability(certifiedSubject) {
      let cert = certifiedSubject;
      if (certifiedSubject.match(/^algebra/i)) cert = "algebra";
      UserService.getVolunteersAvailability(this, cert)
        .then(availability => {
          this.availabilityTable = availability;
          //flattening table makes the implementation of css grid cleaner
          this.availabilityTable.table = availability.table.flat();
          return this.availabilityTable;
        })
        .catch(err => {
          this.errorMsg = err.message;
        });
    },

    /* Helper function that finds the total number of hours where the number of 
        volunteers is less/greater than the inputted value. The boolean 
        lessThan represents if we are calculating for less than (true) or greater 
        than (false)*/
    getNumHours(lessThan) {
      const totalHours = 0;
      const compareNumber = lessThan ? this.lessThan : this.greaterThan;
      if (
        this.availabilityTable.table &&
        this.availabilityTable.table.length != 0
      ) {
        if (compareNumber.length != 0) {
          return this.availabilityTable.table.reduce(function(
            totalHours,
            currentValue
          ) {
            if (
              (!lessThan && currentValue > compareNumber) ||
              (lessThan && currentValue < compareNumber)
            ) {
              totalHours++;
            }
            return totalHours;
          },
          totalHours);
        }
      }
      return totalHours;
    },

    /**
     * Helper function that gets the color of the cell based on
     * whether there are numbers in the lessThan or greaterThan
     * boxes
     */
    getColor(cell) {
      //lessThan and greaterThan have an intersection
      if (
        this.greaterThan.length != 0 &&
        cell > this.greaterThan &&
        this.lessThan.length != 0 &&
        cell < this.lessThan
      ) {
        return this.lessAndGreaterThanColor;
      } else if (this.lessThan.length != 0 && cell < this.lessThan) {
        return this.lessThanColor;
      } else if (this.greaterThan.length != 0 && cell > this.greaterThan) {
        return this.greaterThanColor;
      } else {
        return this.mainColor;
      }
    },

    /**
     * Helper function to convert table cell values into a percentage
     * that determines the opacity of the cell color. Does this by converting
     * the range between max # of volunteers and min # of volunteers in a week
     * into a range that is 20-70 (only want 20-70 because dont ever want
     * 0% or 100% opacity)
     */
    getGradient(cell) {
      return (
        100 -
        (((cell - this.availabilityTable.min) /
          (this.availabilityTable.max - this.availabilityTable.min)) *
          70 +
          20) +
        "%"
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  padding: 30px;
  margin: 0;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}

.wrap-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.container {
  display: flex;
  flex-direction: column;
  margin: 1vw;
  &-metric {
    @extend .container;
    width: 170px;
  }
}

.subheader {
  font-weight: 600;
  justify-content: center;
  align-items: center;
  background-color: #e3f2fd;
  font-size: 20px;
  padding: 10px;
  &-metric {
    @extend .subheader;
    height: 150px;
  }
  &-calendar {
    @extend .subheader;
    height: 50px;
  }
}

.input {
  background-color: white;
  width: 100px;
  font-size: 15px;
  text-align: center;
  border-left-width: 10px;
  border-left-color: rgba(var(--rgb), 0.5);
}

.container-content {
  background-color: #f0f8fd;
  padding: 1vw;
}

.metrics-info {
  font-size: 40px;
}

.subject-selecter {
  background-color: white;
}

.table-layout {
  display: grid;
  grid-template-areas:
    ". days"
    "times data";
  grid-template-columns: auto 1fr;
}

.subtable {
  display: grid;
  grid-gap: 2px;
  &--days {
    @extend .subtable;
    grid-area: days;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: 1fr;
    margin-top: 20px;
    margin-bottom: 5px;
  }
  &--times {
    @extend .subtable;
    grid-area: times;
    justify-content: right;
    grid-template-columns: min-content;
    grid-template-rows: repeat(24, 1fr);
    margin-right: 10px;
    grid-auto-flow: column;
  }
  &--data {
    @extend .subtable;
    grid-area: data;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(24, 1fr);
    grid-auto-flow: column;
  }
}

.cell {
  color: #000;
  &--header {
    @extend .cell;
    font-weight: 500;
    overflow: hidden;
    margin: 0px;
  }
  &--data {
    @extend .cell;
    background-color: rgba(var(--rgb), (var(--hour)));
  }
}

@media only screen and (max-width: 800px) {
  .header {
    padding: 1em 20px 1em 3em !important;
  }
  .cell--header--days {
    visibility: hidden;
    width: 30px;

    &::first-letter {
      text-align: center;
      visibility: visible;
    }
  }
}
</style>
