import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAIwA2ZUQDMm9QBY+AVkV7lATgBMADgA0ITInOmiAdlPGV588tPLtjvooC+-tZoWHiERBAATgCGAO4EUNT0zLQAakz8QkggaGKS0rIKCHpGRNruyny6pjq6ita2CCqKRHxVvo6KvnymvnqBwRg4BMRRcQlJjKwc3JmyuRJSMtlFpipO2op+iuaOynrqxtoNiAC0isbmrQeOu8Z8jo-aRgM5Q2GjMfH4iUz44mBInNsgt8stQEV1G0yj1tFDjI5tF5DicEFCrm09HxzHxvCYodpXiFhuExt9EgAhaIAYwA1rBkDSwMCRHkloVED5jGUXIouh5zEY+ajTo49ERFOott5DGZOiYie8RhEvhMmLBqdFkMzBPNRIsCislMornpBWLTKY+Oo9IjcSL1I4NJKjtpLvoTJ1+q98KgIHA9aERnq2YaIWdHURVPtlIcEapXCKLOLLVVY0Z1Modg9FUHwqRyCGDeD5Eo+BpNHDKj1NNjjMZUVsU65VOYLjW1oSgm8859xj8i2COWifDDyt4SlmTMcbGXmyoTe2amtlIFAkA */
        id: "polyLine",
        initial: "idle",
        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "drawing",
                        actions: ["createLine"]
                    }
                }
            },

            drawing: {
                on: {
                    MOUSEMOVE: {
                        target: "drawing",
                        internal: true,
                        actions: ["setLastPoint"]
                    },

                    MOUSECLICK: {
                        target: "drawing",
                        actions: ["addPoint"],
                        internal: true,
                        cond: "pasPlein"
                    },

                    Enter: {
                        target: "idle",
                        actions: ["saveLine"],
                        cond: "plusDeDeuxPoints"
                    },

                    Backspace: {
                        target: "drawing",
                        actions: "removeLastPoint",
                        internal: true
                    },

                    Escape: {
                        target: "idle",
                        actions: "abandon"
                    }
                }
            }
        }
    },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove(layer.batchDraw());
                // Supprimer la variable polyline :
                
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                if (size>4){
                const provisoire = currentPoints.slice(0, size - 2); // Le point provisoire
                polyline.points(provisoire); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            }},
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length <= (MAX_POINTS*2);
                // Retourner vrai si la polyline a moins de 10 points
                // attention : dans le tableau de points, chaque point est représenté par 2 valeurs (coordonnées x et y)
                
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});
