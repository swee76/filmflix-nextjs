import React, {useEffect, useState} from 'react'
import {RadioGroup} from '@headlessui/react'
import {CheckIcon} from '@heroicons/react/20/solid'
import Header from "../components/header";
import Footer from "../components/footer";
import {child, get, ref as databaseRef, set} from 'firebase/database'
import {FirebaseAuth, FirebaseDatabase} from "../../firebase";
import {useAppDispatch, useAppSelector} from "../hooks";
import {toast} from "react-toastify";
import {UserTypes} from "../enums/user-types";
import {login} from "../features/userSlice";

const frequencies = [
    {value: 'monthly', label: 'Monthly', priceSuffix: '/month'},
    {value: 'annually', label: 'Annually', priceSuffix: '/year'},
];

const tiers = [
    {
        name: 'Basic',
        id: 'tier-basic',
        price: {monthly: '$9.99', annually: '$99.99'},
        description: 'Access to a library of classic movies and basic features.',
        features: ['Limited movie selection', 'Standard video quality', 'Basic support'],
        mostPopular: false,
    },
    {
        name: 'Standard',
        id: 'tier-standard',
        price: {monthly: '$19.99', annually: '$199.99'},
        description: 'More movies and improved streaming quality.',
        features: ['Expanded movie selection', 'HD video quality', 'Priority support'],
        mostPopular: true,
    },
    {
        name: 'Premium',
        id: 'tier-premium',
        price: {monthly: '$29.99', annually: '$299.99'},
        description: 'Unlimited access to our entire movie catalog and premium features.',
        features: ['Unlimited movie selection', '4K Ultra HD video quality', '24/7 premium support'],
        mostPopular: false,
    },
];

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

const Pricing = () => {
    const user = useAppSelector(state => state.user)
    const dispatch = useAppDispatch()

    const [frequency, setFrequency] = useState(frequencies[0])
    const [selectedTier, setSelectedTier] = useState(tiers[1])

    const changePricingFrequency = (newFrequency: any) => {
        setFrequency(newFrequency)
    }

    const [currentPlanFrequency, setCurrentPlanFrequency] = useState('')
    const [currentPlanTier, setCurrentPlanTier] = useState('')

    const getSubscribedPlan = () => {
        get(child(databaseRef(FirebaseDatabase), `subscribedPlans/${user.email.split('@')[0]}/`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setCurrentPlanFrequency(snapshot.val().subscribedFrequency)
                    setCurrentPlanTier(snapshot.val().subscribedTier)

                } else {
                    console.log('No data available')
                }
            })
            .catch((error) => {
                console.error(error)
            })

    }

    useEffect(() => {
        if (user.email) {
            getSubscribedPlan()
        }
    }, []);

    useEffect(() => {
        if (currentPlanFrequency && currentPlanTier) {
            const currentFrequency = frequencies.find((frequency) => frequency.value === currentPlanFrequency)
            const currentTier = tiers.find((tier) => tier.name.toLowerCase() === currentPlanTier)

            setFrequency(currentFrequency)
            setSelectedTier(currentTier)

        }
    }, [currentPlanFrequency, currentPlanTier]);

    const savePlan = (tier, frequency) => {
        get(child(databaseRef(FirebaseDatabase), `users/${user.email.split('@')[0]}/`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const changingUser = snapshot.val()

                    set(databaseRef(FirebaseDatabase, `users/${user.email.split('@')[0]}/`), {
                        ...changingUser,
                        role: UserTypes.subscriber
                    }).then((result) => {
                        set(databaseRef(FirebaseDatabase, `subscribedPlans/${user.email.split('@')[0]}/`), {
                            email: user.email,
                            subscribedFrequency: frequency.value.toLowerCase(),
                            subscribedTier: tier.name.toLowerCase()
                        }).then((result) => {
                            getSubscribedPlan()

                            dispatch(login({
                                ...user,
                                role: UserTypes.subscriber
                            }))

                            toast.success('Plan saved successfully', {
                                position: "top-right",
                                autoClose: 5000,
                                hideProgressBar: true,
                            })
                        }).catch((error) => {
                            toast.error(error.message, {
                                position: "top-right",
                                autoClose: 5000,
                                hideProgressBar: true,
                            })
                        })

                    })

                } else {
                    console.log('No data available')
                }
            })
            .catch((error) => {
                console.error(error)
            })


    }

    return (
        <div className="animated-bg">
            <Header/>
            <div className="bg-transparent py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-base font-semibold leading-7 text-red-800">Pricing</h2>
                        <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                            Affordable Plans for Movie Lovers
                        </p>
                    </div>
                    <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-300">
                        Discover the perfect plan for enjoying your favorite movies and TV shows.
                        Choose from our selection of feature-packed plans designed to elevate your streaming experience.
                    </p>
                    <div className="mt-16 flex justify-center">
                        <RadioGroup
                            value={frequency}
                            onChange={setFrequency}
                            className="grid grid-cols-2 gap-x-1 rounded-full bg-white/5 p-1 text-center text-xs font-semibold leading-5 text-white"
                        >
                            <RadioGroup.Label className="sr-only">Payment frequency</RadioGroup.Label>
                            {frequencies.map((option) => (
                                <RadioGroup.Option
                                    key={option.value}
                                    onChange={() => changePricingFrequency(option.value)}
                                    value={option}
                                    className={({checked}) =>
                                        classNames(checked ? 'bg-red-800' : '', 'cursor-pointer rounded-full px-2.5 py-1')
                                    }
                                >
                                    <span>{option.label}</span>
                                </RadioGroup.Option>
                            ))}
                        </RadioGroup>
                    </div>
                    <RadioGroup value={selectedTier} onChange={setSelectedTier}
                                className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                        {tiers.map((tier) => (
                            <RadioGroup.Option
                                value={tier}
                                key={tier.id}
                                className={({checked}) => classNames(
                                    checked ? 'bg-white/5 ring-2 ring-red-800' : 'ring-1 ring-white/10',
                                    'rounded-3xl p-8 xl:p-10'
                                )}
                                // onClick={() => setSelectedTier(tier)}
                            >
                                <div className="flex items-center justify-between gap-x-4">
                                    <h3 id={tier.id} className="text-lg font-semibold leading-8 text-white">
                                        {tier.name}
                                    </h3>
                                    {tier.mostPopular ? (
                                        <p className="rounded-full bg-red-800 px-2.5 py-1 text-xs font-semibold leading-5 text-white">
                                            Most popular
                                        </p>
                                    ) : null}
                                </div>
                                <p className="mt-4 text-sm leading-6 text-gray-300">{tier.description}</p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span
                                        className="text-4xl font-bold tracking-tight text-white">{tier.price[frequency.value]}</span>
                                    <span
                                        className="text-sm font-semibold leading-6 text-gray-300">{frequency.priceSuffix}</span>
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTier(tier)
                                        savePlan(tier, frequency)
                                    }}
                                    aria-describedby={tier.id}
                                    className={classNames(
                                        tier.mostPopular
                                            ? 'bg-red-800 text-white shadow-sm hover:bg-red-600 focus-visible:outline-red-500'
                                            : 'bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white',
                                        'mt-6 w-full block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
                                    )}
                                >
                                    {tier.name.toLowerCase() === currentPlanTier.toLowerCase() && currentPlanFrequency.toLowerCase() === frequency.value.toLowerCase() ? 'Current Plan' : 'Subscribe'}
                                </button>
                                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-300 xl:mt-10">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <CheckIcon className="h-6 w-5 flex-none text-white" aria-hidden="true"/>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </RadioGroup.Option>
                        ))}
                    </RadioGroup>
                </div>
            </div>
            <Footer/>
        </div>
    );
};

export default Pricing;