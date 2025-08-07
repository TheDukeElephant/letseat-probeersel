import arrowBack from "@/assets/icons/arrow-back.png";
import arrowDown from "@/assets/icons/arrow-down.png";
import arrowRight from "@/assets/icons/arrow-right.png";
import bag from "@/assets/icons/bag.png";
import check from "@/assets/icons/check.png";
import clock from "@/assets/icons/clock.png";
import dollar from "@/assets/icons/dollar.png";
import envelope from "@/assets/icons/envelope.png";
import home from "@/assets/icons/home.png";
import location from "@/assets/icons/location.png";
import logout from "@/assets/icons/logout.png";
import minus from "@/assets/icons/minus.png";
import pencil from "@/assets/icons/pencil.png";
import person from "@/assets/icons/person.png";
import phone from "@/assets/icons/phone.png";
import plus from "@/assets/icons/plus.png";
import search from "@/assets/icons/search.png";
import star from "@/assets/icons/star.png";
import trash from "@/assets/icons/trash.png";
import user from "@/assets/icons/user.png";

import avatar from "@/assets/images/avatar.png";
import avocado from "@/assets/images/avocado.png";
import bacon from "@/assets/images/bacon.png";
import burgerOne from "@/assets/images/burger-one.png";
import burgerTwo from "@/assets/images/burger-two.png";
import buritto from "@/assets/images/buritto.png";
import cheese from "@/assets/images/cheese.png";
import coleslaw from "@/assets/images/coleslaw.png";
import cucumber from "@/assets/images/cucumber.png";
import emptyState from "@/assets/images/empty-state.png";
import fries from "@/assets/images/fries.png";
import loginGraphic from "@/assets/images/login-graphic.png";
import logo from "@/assets/images/logo.png";
import mozarellaSticks from "@/assets/images/mozarella-sticks.png";
import mushrooms from "@/assets/images/mushrooms.png";
import onionRings from "@/assets/images/onion-rings.png";
import onions from "@/assets/images/onions.png";
import pizzaOne from "@/assets/images/pizza-one.png";
import salad from "@/assets/images/salad.png";
import success from "@/assets/images/success.png";
import tomatoes from "@/assets/images/tomatoes.png";

export const CATEGORIES = [
    {
        id: "1",
        name: "All",
    },
    {
        id: "2",
        name: "Burger",
    },
    {
        id: "3",
        name: "Pizza",
    },
    {
        id: "4",
        name: "Wrap",
    },
    {
        id: "5",
        name: "Burrito",
    },
];

export const offers = [
    {
        id: 1,
        title: "Klein Italië",
        description: "Italian Pizza",
        image: pizzaOne,
        color: "#D33B0D",
        rating: 4.5,
        deliverycosts: 2.5,
        costs: 8.5,
        discount: 10,
    },
    {
        id: 2,
        title: "De Ark van Delft",
        description: "Classic Burgers",
        image: burgerTwo,
        color: "#DF5A0C",
        rating: 4.2,
        deliverycosts: 3.0,
        costs: 9.0,
        discount: 10,
    },
    {
        id: 3,
        title: "Klein Italië 2",
        description: "Italian Pizza",
        image: pizzaOne,
        color: "#084137",
        rating: 4.8,
        deliverycosts: 2.0,
        costs: 10.0,
        discount: 10,
    },
    {
        id: 4,
        title: "De Ark van Delft 2",
        description: "Classic Burgers",
        image: burgerTwo,
        color: "#EB920C",
        rating: 4.0,
        deliverycosts: 2.5,
        costs: 7.5,
        discount: 10,
    },
    {
        id: 5,
        title: "Klein Italië 3",
        description: "Italian Pizza",
        image: pizzaOne,
        color: "#084137",
        rating: 4.7,
        deliverycosts: 3.0,
        costs: 9.5,
        discount: 10,
    },
    {
        id: 6,
        title: "De Ark van Delft 3",
        description: "Classic Burgers",
        image: burgerTwo,
        color: "#EB920C",
        rating: 4.3,
        deliverycosts: 2.0,
        costs: 7.0,
        discount: 10,
    },
];

export const sides = [
    {
        name: "Fries",
        image: fries,
        price: 3.5,
    },
    {
        name: "Onion Rings",
        image: onionRings,
        price: 4.0,
    },
    {
        name: "Mozarella Sticks",
        image: mozarellaSticks,
        price: 5.0,
    },
    {
        name: "Coleslaw",
        image: coleslaw,
        price: 2.5,
    },
    {
        name: "Salad",
        image: salad,
        price: 4.5,
    },
];

export const toppings = [
    {
        name: "Avocado",
        image: avocado,
        price: 1.5,
    },
    {
        name: "Bacon",
        image: bacon,
        price: 2.0,
    },
    {
        name: "Cheese",
        image: cheese,
        price: 1.0,
    },
    {
        name: "Cucumber",
        image: cucumber,
        price: 0.5,
    },
    {
        name: "Mushrooms",
        image: mushrooms,
        price: 1.2,
    },
    {
        name: "Onions",
        image: onions,
        price: 0.5,
    },
    {
        name: "Tomatoes",
        image: tomatoes,
        price: 0.7,
    },
];

export const images = {
    avatar,
    avocado,
    bacon,
    burgerOne,
    burgerTwo,
    buritto,
    cheese,
    coleslaw,
    cucumber,
    emptyState,
    fries,
    loginGraphic,
    logo,
    mozarellaSticks,
    mushrooms,
    onionRings,
    onions,
    pizzaOne,
    salad,
    success,
    tomatoes,
    arrowBack,
    arrowDown,
    arrowRight,
    bag,
    check,
    clock,
    dollar,
    envelope,
    home,
    location,
    logout,
    minus,
    pencil,
    person,
    phone,
    plus,
    search,
    star,
    trash,
    user,
};
