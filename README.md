# FitBot
# Overview
This is the interaction model and fulfillment of a Dialogflow virtual personal trainer. It is comprised of 2 main intents, Workout Plan and Single Workout, and 2 sub-intents, How To and Targeting Exercises. All of  the exercise information is retrieved from the Exercises API by API-Ninjas. For Winter 2023 CS466 - Voice Assistants.

## Workout Plan
### Description
This intent has 2 required parameters, day and chunk, which work together to make a workout frequency. 
```
Example:
2 days a week --> days = 2, chunk = {unit: 'wk', amount: 1}
```
Optional parameters are difficulty, goal, workout length, and split. This intent checks for the parameters that are used and gives advise based on their values. 
#### Example Phrases
1. Help me come up with a workout plan
2. I want a beginner bodybuilding workout plan with 3 workouts a week
### Future 
This intent doesn't need the day and chunk parameters to be required, this is left over from a previous version. Overall, the intent could use more specific workout plan advice. There is also a slight issue where advice is only given if a certain parameter is filled. This leads to very short (and subsequently less useful) responses with minimal parameters filled, and if many of the parameters are used the responses can get long and difficult to read. It would be better to break up the text for longer responses and either give more information for shorter responses or ask for more information. 

It would also be better to move the advice to a JSON file in order to clean up the main code. 

## Single Workout
### Description
This intent automatically generates a single workout for the user. The parameters are difficulty, time (duration), split, and muscles, none of which are required. Presumeably the muscle and split parameters wouldn't be in use at the same time, though this isn't verified anywhere. 

The workout is planned in 3 phases:
1. 10-15 minute Cardio Warmup
2. Main Workout
3. 10-15 minute Stretching Cooldown

If none of the parameters are filled, the program will assign a 45 minute, full body workout. To figure out the number of exercises to assign for the main workout, the program assumes that each exercise will take approximately 10 minutes. This means that for a 45 minute workout, 3 main exercises will be given.
```
45 minutes - 10 minute warmup - 10 minute cooldown = 25 minutes --> round up to 30 minutes -> 3 exercises
```
#### Example Phrases
1. Give me an upper body workout
2. I have 45 minutes for cardio
3. I want a shoulder workout
### Known Errors
The biggest error for this intent is that it doesn't work within Dialogflow. The code has been tested in another compiler with a dummy agent and worked perfectly, but I don't know how to get it to work within the chatbot. 

Secondly, the exercises given for each phase of the workout are given with a random number generator to access elements in an array, and there isn't verification of whether or not that particular exercise has already been selected. This can lead to duplicate exercises in the workout listing, especially in the warmup/cooldown phases where the lists that are being chosen from are much shorter. 
### Future
The first thing to do is get the intent working within Dialogflow. Other than that, having better exercise selection would be the most important thing to do. This includes, but is not limited to:
1. Fixing repeat exercises suggestions
2. Evening the distributions between exercises that target certain muscles when more than one muscle is given
3. Possibly prioritizing certain muscles in a split when there are more muscles than exercises
4. Making the cooldown stretches better match the exercises done during the main workout

## How To
### Description
The name of an exercises is this intent's only parameter, and it is required. It gives the user a text-based description of how to do the exercise. 
#### Example Phrases
1. How do I do pushups
2. What's the best way to do barbell squats
3. What are shoulder presses
### Known Errors
The entity matching for this intent isn't very good. 'Exercise' is a custom entity type that is allowed to auto-expand. However, because many exercises are simply a variation of another, unless the exercise is explicitly defined it has a really hard time matching an entire exercise name. It will usually be able to match at least part of the exercise name, but that doesn't necessarily give the correct form. 
### Future
The best way to improve entity matching would be to have a complete list of the exercises within the API. I don't know if the auto-expansion would ever get good enough that a full list wouldn't be necessary, nor do I know how many entries it would need before that happened. I don't know of a way to get a comprehensive list. 

Besides improving entity matching, the biggest improvement that could be made to this intent would be adding a visual component, whether a video, gif, or simply a sequence of images. This would likely require the use of another API. 

## Targeting Exercises
### Description
The only parameter for this intent is the name of a muscle, and it is required. It gives the user a list of 10 exercises that target the given muscle.
#### Example Phrases
1. What exercises target my chest
2. How to train my quads
3. Exercises for strong lats
### Future
The list doesn't come with line breaks between the exercises, making the response difficult to read. There are line breaks in the string given to the agent, but they aren't displayed when interacting with the bot. I don't know how to execute it, but improving the formatting would make it much easier to use. 

## Help
### Description
There are 5 help intents, 1 general help and 4 intent specific helps
* General Help -- gives a general overview of the agent and tells the user how to get to the other help intents
* Intent Specific Help -- gives an overview of the specific intent and a phrase to get the user started using that intent

# Use
To try the bot, you can follow [this link](https://bot.dialogflow.com/35696ed9-14b6-4ba0-ba62-f2c23334ac2c). To use the code, you will have to create your own agent. 
Upload the [FitBot-interactionModel](/FitBot-interactionModel) folder as a zip within the Dialogflow console settings and copy/upload [Fitbot-fulfillment/index.js](/FitBot-fulfillment/index.js) to the fulfillment.

# Testing
No automated tests have been written for this project. All testing has been done manually in either the Dialogflow Console or Web Demo. 

# Helpful Links
* [Dialogflow ES Docs](https://cloud.google.com/dialogflow/es/docs)
* [Exercises by API-Ninjas](https://rapidapi.com/apininjas/api/exercises-by-api-ninjas)
* [Exercises API Docs](https://rapidapi.com/apininjas/api/exercises-by-api-ninjas)
