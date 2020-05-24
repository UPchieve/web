import { PHYSICS_MAPPING } from "../consts";

const isPhysics = subTopic => Object.keys(PHYSICS_MAPPING).includes(subTopic);

export default isPhysics;
