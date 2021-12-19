const FIRST_NAME = "FIRST_NAME"
const LAST_NAME = "LAST_NAME"
const SOCIAL_SEC = "SOCIAL_SEC"
const GENDER = "GENDER"
const BIRTH_DATE = "BIRTH_DATE"
const ST_ADDR_1 = "ST_ADDR_1"
const ST_ADDR_2 = "ST_ADDR_2"
const TOWN = "TOWN"
const ZIP = "ZIP"
////////////////////

const HEIGHT = "HEIGHT"
const WEIGHT = "WEIGHT"
const SMOKER = "SMOKER"
const TREATMENT = "TREATMENT"
const TREAT_SUCCESS = "TREAT_SUCCESS"
const OVERALL_OUTCOME = "OVERALL_OUTCOME"

///////////////////

const levels = { 
    "1": [FIRST_NAME, LAST_NAME, SOCIAL_SEC, GENDER, BIRTH_DATE, ST_ADDR_1, ST_ADDR_2, TOWN, ZIP],
    "2": [LAST_NAME, SOCIAL_SEC, BIRTH_DATE, GENDER, ST_ADDR_1, ST_ADDR_2, TOWN, ZIP],
    "3": [SOCIAL_SEC, BIRTH_DATE,  GENDER],
    "4": [FIRST_NAME, LAST_NAME, GENDER, BIRTH_DATE, ST_ADDR_1, ST_ADDR_2, TOWN, ZIP],
    "5": [FIRST_NAME, LAST_NAME, GENDER, BIRTH_DATE, TOWN, ZIP],
    "6": [ST_ADDR_1, ST_ADDR_2, TOWN, ZIP],
    "7": [FIRST_NAME, LAST_NAME, BIRTH_DATE]
}

const weights = {
    FIRST_NAME: 9,
    LAST_NAME: 9,
    SOCIAL_SEC: 8,
    GENDER: 8,
    BIRTH_DATE: 9,
    ST_ADDR_1: 6,
    ST_ADDR_2: 6,
    TOWN: 7,
    ZIP: 7,
    HEIGHT: 9,
    WEIGHT: 9,
    SMOKER: 9,
    TREATMENT: 9,
    TREAT_SUCCESS: 9,
    OVERALL_OUTCOME: 9
}

const NUMERICAL = [HEIGHT, TREAT_SUCCESS]

const INDEPENDENT = [FIRST_NAME, LAST_NAME, SOCIAL_SEC, GENDER, BIRTH_DATE, ST_ADDR_1, ST_ADDR_2, TOWN, ZIP,
                    WEIGHT, HEIGHT, SMOKER, TREATMENT]
const DEPENDENT = [TREAT_SUCCESS, OVERALL_OUTCOME]

const ALL = [FIRST_NAME, LAST_NAME, SOCIAL_SEC, GENDER, BIRTH_DATE, ST_ADDR_1, ST_ADDR_2, TOWN, ZIP, WEIGHT, HEIGHT, SMOKER, TREATMENT, TREAT_SUCCESS, OVERALL_OUTCOME]

const NUM_LINK_LEVELS = 2

module.exports = Object.freeze({
    ALL,
    INDEPENDENT, 
    DEPENDENT,
    levels,
    weights,
    NUMERICAL,
    NUM_LINK_LEVELS,
});
