import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MapPin, Users, Target, CheckCircle, ArrowRight, ArrowLeft, Navigation, TestTube, Lightbulb } from "lucide-react";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for demo choice
  const [isComplete, setIsComplete] = useState(false);
  const [wantsDemoMode, setWantsDemoMode] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const { toast } = useToast();

  // Demo data (same as in settings)
  const demoData = {
    herds: [
      {
        userId: 1,
        name: "Main Cattle Herd",
        species: "cattle",
        breed: "Angus",
        count: 25,
        averageWeight: "1200",
        age: "3",
        ageUnit: "years",
        sex: "mixed",
        lactating: true,
        lactatingCount: 15,
        dmPercent: "2.5"
      },
      {
        userId: 1,
        name: "Young Bulls",
        species: "cattle", 
        breed: "Hereford",
        count: 8,
        averageWeight: "800",
        age: "18",
        ageUnit: "months",
        sex: "male",
        lactating: false,
        lactatingCount: null,
        dmPercent: "2.8"
      },
      {
        userId: 1,
        name: "Sheep Flock",
        species: "sheep",
        breed: "Dorper",
        count: 40,
        averageWeight: "150",
        age: "2",
        ageUnit: "years", 
        sex: "mixed",
        lactating: true,
        lactatingCount: 25,
        dmPercent: "3.2"
      }
    ],
    paddocks: [
      {
        userId: 1,
        name: "North Pasture",
        acres: "12.50",
        pastureType: "mixed",
        currentlyGrazing: true,
        restDays: 35,
        shadeAvailability: "moderate",
        shadeType: "natural",
        waterSources: 2,
        gpsCoordinates: null,
        lastGrazed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 1,
        name: "South Field",
        acres: "8.30",
        pastureType: "lush",
        currentlyGrazing: false,
        restDays: 28,
        shadeAvailability: "excellent",
        shadeType: "artificial",
        waterSources: 1,
        gpsCoordinates: null,
        lastGrazed: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 1,
        name: "East Bottom",
        acres: "6.70",
        pastureType: "native",
        currentlyGrazing: false,
        restDays: 42,
        shadeAvailability: "minimal",
        shadeType: "natural",
        waterSources: 1,
        gpsCoordinates: null,
        lastGrazed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 1,
        name: "West Ridge",
        acres: "15.20",
        pastureType: "mixed",
        currentlyGrazing: false,
        restDays: 35,
        shadeAvailability: "moderate",
        shadeType: "natural",
        waterSources: 3,
        gpsCoordinates: null,
        lastGrazed: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      }
    ],
    animals: [
      // Main Cattle Herd (25 Angus cattle - 15 lactating, 10 non-lactating)
      { userId: 1, herdId: 1, earTagNumber: "001", name: "Bessie", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2021, 3, 15).toISOString(), weight: "1250", lactating: true, pregnancyStatus: "open", notes: "Excellent condition, good milk production" },
      { userId: 1, herdId: 1, earTagNumber: "002", name: "Thunder", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2020, 8, 22).toISOString(), weight: "1800", lactating: false, pregnancyStatus: null, notes: "Prime breeding bull, aggressive but manageable" },
      { userId: 1, herdId: 1, earTagNumber: "003", name: "Daisy", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2020, 1, 10).toISOString(), weight: "1180", lactating: true, pregnancyStatus: "open", notes: "Good condition, regular milker" },
      { userId: 1, herdId: 1, earTagNumber: "004", name: "Duke", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2019, 5, 5).toISOString(), weight: "1650", lactating: false, pregnancyStatus: null, notes: "Excellent breeder, calm temperament" },
      { userId: 1, herdId: 1, earTagNumber: "005", name: "Ruby", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2021, 7, 12).toISOString(), weight: "1100", lactating: true, pregnancyStatus: "bred", notes: "First-time mother, monitoring closely" },
      { userId: 1, herdId: 1, earTagNumber: "006", name: "Buster", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2022, 2, 28).toISOString(), weight: "950", lactating: false, pregnancyStatus: null, notes: "Young bull, growing well" },
      { userId: 1, herdId: 1, earTagNumber: "007", name: "Molly", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2020, 6, 20).toISOString(), weight: "1220", lactating: true, pregnancyStatus: "open", notes: "Consistent producer, good mother" },
      { userId: 1, herdId: 1, earTagNumber: "008", name: "Rex", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2021, 0, 8).toISOString(), weight: "1400", lactating: false, pregnancyStatus: null, notes: "Growing steers, market ready soon" },
      { userId: 1, herdId: 1, earTagNumber: "009", name: "Belle", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2019, 11, 15).toISOString(), weight: "1280", lactating: true, pregnancyStatus: "bred", notes: "Veteran cow, excellent genetics" },
      { userId: 1, herdId: 1, earTagNumber: "010", name: "Rocky", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2020, 4, 3).toISOString(), weight: "1550", lactating: false, pregnancyStatus: null, notes: "Strong frame, good weight gain" },
      { userId: 1, herdId: 1, earTagNumber: "011", name: "Luna", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2021, 9, 18).toISOString(), weight: "1150", lactating: true, pregnancyStatus: "open", notes: "Good condition, regular health checks" },
      { userId: 1, herdId: 1, earTagNumber: "012", name: "Max", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2022, 1, 14).toISOString(), weight: "850", lactating: false, pregnancyStatus: null, notes: "Youngest in herd, thriving" },
      { userId: 1, herdId: 1, earTagNumber: "013", name: "Rosie", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2020, 3, 25).toISOString(), weight: "1190", lactating: true, pregnancyStatus: "bred", notes: "Excellent mother, twins last year" },
      { userId: 1, herdId: 1, earTagNumber: "014", name: "Ranger", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2021, 6, 7).toISOString(), weight: "1300", lactating: false, pregnancyStatus: null, notes: "Active grazer, good forager" },
      { userId: 1, herdId: 1, earTagNumber: "015", name: "Penny", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2019, 8, 30).toISOString(), weight: "1260", lactating: true, pregnancyStatus: "open", notes: "Reliable producer, easy handling" },
      { userId: 1, herdId: 1, earTagNumber: "016", name: "Scout", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2021, 11, 11).toISOString(), weight: "1050", lactating: false, pregnancyStatus: null, notes: "Fast growth, good appetite" },
      { userId: 1, herdId: 1, earTagNumber: "017", name: "Grace", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2020, 7, 16).toISOString(), weight: "1200", lactating: true, pregnancyStatus: "bred", notes: "Gentle nature, good with handlers" },
      { userId: 1, herdId: 1, earTagNumber: "018", name: "Brock", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2020, 10, 2).toISOString(), weight: "1480", lactating: false, pregnancyStatus: null, notes: "Strong build, potential breeder" },
      { userId: 1, herdId: 1, earTagNumber: "019", name: "Stella", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2021, 5, 22).toISOString(), weight: "1170", lactating: true, pregnancyStatus: "open", notes: "Average producer, healthy" },
      { userId: 1, herdId: 1, earTagNumber: "020", name: "Jake", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2021, 8, 9).toISOString(), weight: "1250", lactating: false, pregnancyStatus: null, notes: "Steady grower, calm demeanor" },
      { userId: 1, herdId: 1, earTagNumber: "021", name: "Fern", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2019, 2, 17).toISOString(), weight: "1290", lactating: true, pregnancyStatus: "bred", notes: "Matriarch of herd, excellent genetics" },
      { userId: 1, herdId: 1, earTagNumber: "022", name: "Cash", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2022, 0, 5).toISOString(), weight: "780", lactating: false, pregnancyStatus: null, notes: "Youngest bull, promising growth" },
      { userId: 1, herdId: 1, earTagNumber: "023", name: "Iris", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2020, 9, 13).toISOString(), weight: "1210", lactating: true, pregnancyStatus: "open", notes: "Good milk production, easy calving" },
      { userId: 1, herdId: 1, earTagNumber: "024", name: "Blaze", species: "cattle", breed: "Angus", sex: "male", birthDate: new Date(2021, 4, 1).toISOString(), weight: "1350", lactating: false, pregnancyStatus: null, notes: "Energetic, good grazer" },
      { userId: 1, herdId: 1, earTagNumber: "025", name: "Willow", species: "cattle", breed: "Angus", sex: "female", birthDate: new Date(2021, 2, 26).toISOString(), weight: "1140", lactating: true, pregnancyStatus: "bred", notes: "First breeding season, monitoring" },

      // Young Bulls (8 Hereford bulls - 18 months old)
      { userId: 1, herdId: 2, earTagNumber: "B01", name: "Titan", species: "cattle", breed: "Hereford", sex: "male", birthDate: new Date(2022, 6, 15).toISOString(), weight: "850", lactating: false, pregnancyStatus: null, notes: "Young bull, excellent potential" },
      { userId: 1, herdId: 2, earTagNumber: "B02", name: "Atlas", species: "cattle", breed: "Hereford", sex: "male", birthDate: new Date(2022, 6, 20).toISOString(), weight: "820", lactating: false, pregnancyStatus: null, notes: "Strong frame, good growth rate" },
      { userId: 1, herdId: 2, earTagNumber: "B03", name: "Zeus", species: "cattle", breed: "Hereford", sex: "male", birthDate: new Date(2022, 7, 2).toISOString(), weight: "780", lactating: false, pregnancyStatus: null, notes: "Aggressive feeder, rapid growth" },
      { userId: 1, herdId: 2, earTagNumber: "B04", name: "Thor", species: "cattle", breed: "Hereford", sex: "male", birthDate: new Date(2022, 7, 10).toISOString(), weight: "800", lactating: false, pregnancyStatus: null, notes: "Muscular build, future breeder" },
      { userId: 1, herdId: 2, earTagNumber: "B05", name: "Diesel", species: "cattle", breed: "Hereford", sex: "male", birthDate: new Date(2022, 5, 28).toISOString(), weight: "860", lactating: false, pregnancyStatus: null, notes: "Largest of the group, dominant" },
      { userId: 1, herdId: 2, earTagNumber: "B06", name: "Storm", species: "cattle", breed: "Hereford", sex: "male", birthDate: new Date(2022, 8, 5).toISOString(), weight: "750", lactating: false, pregnancyStatus: null, notes: "Younger but catching up quickly" },
      { userId: 1, herdId: 2, earTagNumber: "B07", name: "Rebel", species: "cattle", breed: "Hereford", sex: "male", birthDate: new Date(2022, 6, 1).toISOString(), weight: "830", lactating: false, pregnancyStatus: null, notes: "Independent, strong grazer" },
      { userId: 1, herdId: 2, earTagNumber: "B08", name: "Ranger2", species: "cattle", breed: "Hereford", sex: "male", birthDate: new Date(2022, 7, 18).toISOString(), weight: "790", lactating: false, pregnancyStatus: null, notes: "Good conformation, steady growth" },

      // Sheep Flock (40 Dorper sheep - 25 lactating, 15 non-lactating)
      { userId: 1, herdId: 3, earTagNumber: "S001", name: "Dot", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 2, 10).toISOString(), weight: "160", lactating: true, pregnancyStatus: "open", notes: "Lead ewe, excellent mother" },
      { userId: 1, herdId: 3, earTagNumber: "S002", name: "Pepper", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 3, 15).toISOString(), weight: "155", lactating: true, pregnancyStatus: "bred", notes: "Good milk production" },
      { userId: 1, herdId: 3, earTagNumber: "S003", name: "Sage", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2020, 11, 20).toISOString(), weight: "170", lactating: true, pregnancyStatus: "open", notes: "Veteran ewe, reliable" },
      { userId: 1, herdId: 3, earTagNumber: "S004", name: "Clover", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 1, 5).toISOString(), weight: "150", lactating: true, pregnancyStatus: "bred", notes: "First-time mother" },
      { userId: 1, herdId: 3, earTagNumber: "S005", name: "Mint", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2020, 8, 12).toISOString(), weight: "165", lactating: true, pregnancyStatus: "open", notes: "Twins last season" },
      { userId: 1, herdId: 3, earTagNumber: "S006", name: "Basil", species: "sheep", breed: "Dorper", sex: "male", birthDate: new Date(2019, 4, 8).toISOString(), weight: "200", lactating: false, pregnancyStatus: null, notes: "Prime ram, excellent genetics" },
      { userId: 1, herdId: 3, earTagNumber: "S007", name: "Rosemary", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 5, 22).toISOString(), weight: "145", lactating: true, pregnancyStatus: "open", notes: "Young ewe, first lambing" },
      { userId: 1, herdId: 3, earTagNumber: "S008", name: "Thyme", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2020, 10, 3).toISOString(), weight: "158", lactating: true, pregnancyStatus: "bred", notes: "Good condition, easy keeper" },
      { userId: 1, herdId: 3, earTagNumber: "S009", name: "Parsley", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 7, 14).toISOString(), weight: "140", lactating: true, pregnancyStatus: "open", notes: "Smaller frame, healthy" },
      { userId: 1, herdId: 3, earTagNumber: "S010", name: "Oregano", species: "sheep", breed: "Dorper", sex: "male", birthDate: new Date(2021, 0, 18).toISOString(), weight: "175", lactating: false, pregnancyStatus: null, notes: "Young ram, developing well" },
      { userId: 1, herdId: 3, earTagNumber: "S011", name: "Dill", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2020, 6, 25).toISOString(), weight: "162", lactating: true, pregnancyStatus: "open", notes: "Consistent producer" },
      { userId: 1, herdId: 3, earTagNumber: "S012", name: "Fennel", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 4, 9).toISOString(), weight: "148", lactating: true, pregnancyStatus: "bred", notes: "Second season breeding" },
      { userId: 1, herdId: 3, earTagNumber: "S013", name: "Cinnamon", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2020, 9, 16).toISOString(), weight: "167", lactating: true, pregnancyStatus: "open", notes: "Large frame, good milker" },
      { userId: 1, herdId: 3, earTagNumber: "S014", name: "Nutmeg", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 8, 7).toISOString(), weight: "152", lactating: true, pregnancyStatus: "bred", notes: "Average size, good health" },
      { userId: 1, herdId: 3, earTagNumber: "S015", name: "Ginger", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2020, 12, 1).toISOString(), weight: "159", lactating: true, pregnancyStatus: "open", notes: "Energetic, good forager" },
      { userId: 1, herdId: 3, earTagNumber: "S016", name: "Paprika", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 6, 11).toISOString(), weight: "143", lactating: true, pregnancyStatus: "bred", notes: "Young mother, monitoring" },
      { userId: 1, herdId: 3, earTagNumber: "S017", name: "Curry", species: "sheep", breed: "Dorper", sex: "male", birthDate: new Date(2020, 3, 29).toISOString(), weight: "185", lactating: false, pregnancyStatus: null, notes: "Backup ram, good genetics" },
      { userId: 1, herdId: 3, earTagNumber: "S018", name: "Vanilla", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 9, 23).toISOString(), weight: "138", lactating: true, pregnancyStatus: "open", notes: "Sweet temperament" },
      { userId: 1, herdId: 3, earTagNumber: "S019", name: "Turmeric", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2020, 5, 17).toISOString(), weight: "161", lactating: true, pregnancyStatus: "bred", notes: "Strong constitution" },
      { userId: 1, herdId: 3, earTagNumber: "S020", name: "Cardamom", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 11, 4).toISOString(), weight: "147", lactating: true, pregnancyStatus: "open", notes: "Youngest lactating ewe" },
      { userId: 1, herdId: 3, earTagNumber: "S021", name: "Saffron", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2020, 2, 21).toISOString(), weight: "164", lactating: true, pregnancyStatus: "bred", notes: "Premium bloodline" },
      { userId: 1, herdId: 3, earTagNumber: "S022", name: "Anise", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 1, 13).toISOString(), weight: "151", lactating: true, pregnancyStatus: "open", notes: "Gentle nature" },
      { userId: 1, herdId: 3, earTagNumber: "S023", name: "Cumin", species: "sheep", breed: "Dorper", sex: "male", birthDate: new Date(2020, 7, 8).toISOString(), weight: "182", lactating: false, pregnancyStatus: null, notes: "Growing ram" },
      { userId: 1, herdId: 3, earTagNumber: "S024", name: "Clove", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2021, 6, 26).toISOString(), weight: "144", lactating: true, pregnancyStatus: "bred", notes: "First-time mother" },
      { userId: 1, herdId: 3, earTagNumber: "S025", name: "Allspice", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2020, 4, 14).toISOString(), weight: "156", lactating: true, pregnancyStatus: "open", notes: "Reliable producer" },
      { userId: 1, herdId: 3, earTagNumber: "S026", name: "Bay", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 2, 8).toISOString(), weight: "95", lactating: false, pregnancyStatus: null, notes: "Young ewe, not breeding yet" },
      { userId: 1, herdId: 3, earTagNumber: "S027", name: "Cedar", species: "sheep", breed: "Dorper", sex: "male", birthDate: new Date(2022, 3, 15).toISOString(), weight: "110", lactating: false, pregnancyStatus: null, notes: "Young ram prospect" },
      { userId: 1, herdId: 3, earTagNumber: "S028", name: "Lavender", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 1, 22).toISOString(), weight: "88", lactating: false, pregnancyStatus: null, notes: "Growing well" },
      { userId: 1, herdId: 3, earTagNumber: "S029", name: "Juniper", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 4, 5).toISOString(), weight: "92", lactating: false, pregnancyStatus: null, notes: "Young ewe" },
      { userId: 1, herdId: 3, earTagNumber: "S030", name: "Chamomile", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 0, 19).toISOString(), weight: "85", lactating: false, pregnancyStatus: null, notes: "Smallest of young ewes" },
      { userId: 1, herdId: 3, earTagNumber: "S031", name: "Eucalyptus", species: "sheep", breed: "Dorper", sex: "male", birthDate: new Date(2022, 5, 12).toISOString(), weight: "105", lactating: false, pregnancyStatus: null, notes: "Active young ram" },
      { userId: 1, herdId: 3, earTagNumber: "S032", name: "Jasmine", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 3, 28).toISOString(), weight: "90", lactating: false, pregnancyStatus: null, notes: "Delicate build" },
      { userId: 1, herdId: 3, earTagNumber: "S033", name: "Magnolia", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 2, 14).toISOString(), weight: "87", lactating: false, pregnancyStatus: null, notes: "Young ewe" },
      { userId: 1, herdId: 3, earTagNumber: "S034", name: "Pine", species: "sheep", breed: "Dorper", sex: "male", birthDate: new Date(2022, 1, 7).toISOString(), weight: "98", lactating: false, pregnancyStatus: null, notes: "Strong young ram" },
      { userId: 1, herdId: 3, earTagNumber: "S035", name: "Rose", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 4, 21).toISOString(), weight: "93", lactating: false, pregnancyStatus: null, notes: "Beautiful young ewe" },
      { userId: 1, herdId: 3, earTagNumber: "S036", name: "Willow", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 0, 2).toISOString(), weight: "82", lactating: false, pregnancyStatus: null, notes: "Graceful movement" },
      { userId: 1, herdId: 3, earTagNumber: "S037", name: "Oak", species: "sheep", breed: "Dorper", sex: "male", birthDate: new Date(2022, 3, 8).toISOString(), weight: "102", lactating: false, pregnancyStatus: null, notes: "Sturdy build" },
      { userId: 1, herdId: 3, earTagNumber: "S038", name: "Maple", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 2, 25).toISOString(), weight: "89", lactating: false, pregnancyStatus: null, notes: "Sweet disposition" },
      { userId: 1, herdId: 3, earTagNumber: "S039", name: "Birch", species: "sheep", breed: "Dorper", sex: "female", birthDate: new Date(2022, 1, 11).toISOString(), weight: "86", lactating: false, pregnancyStatus: null, notes: "Pale coloring" },
      { userId: 1, herdId: 3, earTagNumber: "S040", name: "Aspen", species: "sheep", breed: "Dorper", sex: "male", birthDate: new Date(2022, 4, 3).toISOString(), weight: "96", lactating: false, pregnancyStatus: null, notes: "Future breeding prospect" }
    ]
  };

  // Load demo data function
  const loadDemoData = async () => {
    setIsLoadingDemo(true);
    try {
      // Clear existing data first
      await Promise.allSettled([
        fetch('/api/herds?userId=1', { method: 'DELETE' }),
        fetch('/api/paddocks?userId=1', { method: 'DELETE' }),
        fetch('/api/animals?userId=1', { method: 'DELETE' }),
        fetch('/api/assessments?userId=1', { method: 'DELETE' })
      ]);
      
      // Create herds first
      const createdHerds = [];
      for (const herd of demoData.herds) {
        const response = await apiRequest("POST", "/api/herds", herd);
        const createdHerd = await response.json();
        createdHerds.push(createdHerd);
      }

      // Create paddocks
      for (const paddock of demoData.paddocks) {
        // Convert lastGrazed back to Date if it exists
        const paddockData = {
          ...paddock,
          lastGrazed: paddock.lastGrazed ? new Date(paddock.lastGrazed) : null
        };
        await apiRequest("POST", "/api/paddocks", paddockData);
      }

      // Create animals with updated herd IDs
      for (const animal of demoData.animals) {
        // Map animal to correct herd based on herdId
        const herdIndex = animal.herdId - 1; // herdId 1,2,3 maps to index 0,1,2
        const actualHerdId = createdHerds[herdIndex]?.id || createdHerds[0].id;
        
        const animalData = { 
          ...animal, 
          herdId: actualHerdId,
          birthDate: animal.birthDate ? new Date(animal.birthDate) : null
        };
        await apiRequest("POST", "/api/animals", animalData);
      }

      // Set demo mode and completion flags in localStorage
      localStorage.setItem('demoMode', 'true');
      localStorage.setItem('grazePro-onboardingComplete', 'true');
      localStorage.setItem('userPreferences', JSON.stringify({ onboardingCompleted: true }));

      // Refresh all data
      queryClient.invalidateQueries();

      toast({
        title: "Demo Mode Activated",
        description: "Sample farm data loaded successfully! Explore all features with realistic data.",
      });

      setIsLoadingDemo(false);
      return true;
    } catch (error) {
      // Demo data initialization encountered an error
      toast({
        title: "Error",
        description: "Failed to load demo data. Please try again.",
        variant: "destructive",
      });
      setIsLoadingDemo(false);
      return false;
    }
  };

  // Form data
  const [farmData, setFarmData] = useState({
    farmName: "",
    farmSize: "",
    primaryLivestock: "",
    currentHeadCount: "",
    typicalRotation: "",
    location: { lat: 0, lon: 0, zipcode: "" }
  });

  const [paddockData, setPaddockData] = useState([
    { name: "", acres: "", pastureType: "mixed" },
    { name: "", acres: "", pastureType: "mixed" },
    { name: "", acres: "", pastureType: "mixed" }
  ]);

  const [livestockGroups, setLivestockGroups] = useState([
    {
      id: 1,
      name: "",
      species: "",
      breed: "",
      count: "",
      averageWeight: "",
      ageGroup: "",
      sex: "",
      lactating: false,
      lactatingCount: "",
      pregnancyStatus: "",
      notes: ""
    }
  ]);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFarmData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              zipcode: prev.location.zipcode
            }
          }));
          toast({
            title: "Location Captured",
            description: "GPS coordinates saved for accurate recommendations",
          });
        },
        () => {
          toast({
            title: "Location Access Denied",
            description: "Please enter your zipcode for weather data",
            variant: "destructive"
          });
        }
      );
    }
  };

  // Livestock group management
  const addLivestockGroup = () => {
    const newId = Math.max(...livestockGroups.map(g => g.id), 0) + 1;
    setLivestockGroups([...livestockGroups, {
      id: newId,
      name: "",
      species: "",
      breed: "",
      count: "",
      averageWeight: "",
      ageGroup: "",
      sex: "",
      lactating: false,
      lactatingCount: "",
      pregnancyStatus: "",
      notes: ""
    }]);
  };

  const removeLivestockGroup = (id: number) => {
    if (livestockGroups.length > 1) {
      setLivestockGroups(livestockGroups.filter(g => g.id !== id));
    }
  };

  const updateLivestockGroup = (id: number, field: string, value: any) => {
    setLivestockGroups(livestockGroups.map(group => 
      group.id === id ? { ...group, [field]: value } : group
    ));
  };

  // Get suggested default values based on species
  const getSpeciesDefaults = (species: string) => {
    const defaults = {
      cattle: { weight: "1200", ageOptions: ["Calf", "Yearling", "Adult", "Senior"] },
      sheep: { weight: "150", ageOptions: ["Lamb", "Yearling", "Adult", "Senior"] },
      goat: { weight: "120", ageOptions: ["Kid", "Yearling", "Adult", "Senior"] },
      horse: { weight: "1000", ageOptions: ["Foal", "Yearling", "Adult", "Senior"] },
    };
    return defaults[species as keyof typeof defaults] || { weight: "", ageOptions: ["Young", "Adult", "Senior"] };
  };

  // Create herd mutation
  const createHerdMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/herds", data);
      return response.json();
    },
  });

  // Create paddock mutation
  const createPaddockMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/paddocks", data);
      return response.json();
    },
  });

  const handleComplete = async () => {
    try {
      // Create all livestock groups as herds
      for (const group of livestockGroups) {
        if (group.name && group.species && group.count) {
          const herdPayload = {
            name: group.name,
            species: group.species.toLowerCase(),
            breed: group.breed || "Mixed",
            count: parseInt(group.count),
            averageWeight: group.averageWeight || getSpeciesDefaults(group.species).weight,
            age: group.ageGroup || "adult",
            ageUnit: "years",
            sex: group.sex || "mixed",
            lactating: group.lactating,
            lactatingCount: group.lactating ? parseInt(group.lactatingCount || "0") : 0,
            dmPercent: group.species === "sheep" ? "3.2" : group.species === "goat" ? "3.5" : "2.5",
            userId: 1
          };

          await createHerdMutation.mutateAsync(herdPayload);
        }
      }

      // Create paddocks
      for (const paddock of paddockData) {
        if (paddock.name && paddock.acres) {
          const paddockPayload = {
            name: paddock.name,
            acres: parseFloat(paddock.acres),
            pastureType: paddock.pastureType,
            restDays: 30,
            currentlyGrazing: false,
            lastGrazed: null,
            waterSources: 1,
            fencingCondition: "good",
            soilType: "mixed",
            drainageQuality: "moderate",
            userId: 1
          };
          
          await createPaddockMutation.mutateAsync(paddockPayload);
        }
      }

      // Save farm location
      if (farmData.location.lat !== 0) {
        localStorage.setItem('grazePro-savedLocation', JSON.stringify({
          lat: farmData.location.lat,
          lon: farmData.location.lon,
          name: farmData.farmName || "Farm Location"
        }));
      }

      // Save onboarding completion
      localStorage.setItem('grazePro-onboardingComplete', 'true');
      localStorage.setItem('grazePro-farmProfile', JSON.stringify(farmData));

      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/paddocks"] });

      setIsComplete(true);
      
      setTimeout(() => {
        onComplete();
        onClose();
      }, 2000);

    } catch (error) {
      toast({
        title: "Setup Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive"
      });
    }
  };

  const steps = [
    { 
      number: 0, 
      title: "Welcome", 
      description: "Choose your setup method",
      explanation: "Let's get your farm set up for rotational grazing. You can either use demo data to explore the app, or set up your actual farm information."
    },
    { 
      number: 1, 
      title: "Farm Profile", 
      description: "Basic farm information",
      explanation: "Tell us about your farm. This helps us provide location-specific recommendations for grass growth, weather, and optimal grazing periods."
    },
    { 
      number: 2, 
      title: "Location", 
      description: "Set your farm location",
      explanation: "Your location determines climate-specific recommendations for rest periods, seasonal adjustments, and weather-based alerts. GPS is most accurate, but zipcode works too."
    },
    { 
      number: 3, 
      title: "Livestock Groups", 
      description: "Organize your animals",
      explanation: "Create separate groups for different animal types, ages, or breeding status. This helps calculate specific water and feed needs for each group."
    },
    { 
      number: 4, 
      title: "Paddocks", 
      description: "Create your grazing areas",
      explanation: "Add your paddocks (fields) with their sizes and types. We recommend at least 3-4 paddocks for effective rotation. You can add more later."
    },
    { 
      number: 5, 
      title: "Complete", 
      description: "Finish setup",
      explanation: "Review your setup and start managing your rotational grazing system."
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (isComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
            <p className="text-gray-600 mb-4">
              Your farm is ready for rotational grazing management.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Livestock Groups:</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex justify-between">
                <span>Paddocks Created:</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex justify-between">
                <span>Location Configured:</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Farm Setup Wizard</span>
          </DialogTitle>
          <DialogDescription>
            Set up your farm profile, livestock, and paddocks to get personalized grazing recommendations.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center space-y-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.number <= currentStep 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step.number}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Step Explanation */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            {currentStepData?.title}
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            {currentStepData?.explanation}
          </p>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            <p className="text-sm text-gray-600">{currentStepData.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Step 0: Demo Mode Choice */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to Cadence!</h3>
                  <p className="text-gray-600 mb-6">
                    How would you like to get started with your grazing management system?
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Demo Mode Option */}
                  <Card className={`border-2 cursor-pointer transition-all ${
                    wantsDemoMode 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`} onClick={() => setWantsDemoMode(true)}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <TestTube className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Explore with Demo Data
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Perfect for trying Cadence! We'll load realistic sample data so you can explore all features immediately.
                          </p>
                          <div className="text-xs text-orange-700 bg-orange-100 rounded p-2">
                            <strong>Includes:</strong> 3 herds (73 animals) • 4 paddocks • Assessment history • Tips throughout
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            wantsDemoMode 
                              ? 'bg-orange-500 border-orange-500' 
                              : 'border-gray-300'
                          }`}>
                            {wantsDemoMode && <div className="w-full h-full bg-white rounded-full scale-50"></div>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Manual Setup Option */}
                  <Card className={`border-2 cursor-pointer transition-all ${
                    !wantsDemoMode 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`} onClick={() => setWantsDemoMode(false)}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <Users className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Set Up My Farm
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Start fresh with your own farm data. We'll guide you through adding your livestock, paddocks, and farm details.
                          </p>
                          <div className="text-xs text-green-700 bg-green-100 rounded p-2">
                            <strong>Best for:</strong> Farm owners ready to add their real livestock and paddock information
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            !wantsDemoMode 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-300'
                          }`}>
                            {!wantsDemoMode && <div className="w-full h-full bg-white rounded-full scale-50"></div>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> You can always switch between demo mode and your own data in Settings. 
                    Demo data helps you understand Cadence's capabilities before committing your farm information.
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Farm Profile */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="farmName">Farm Name (Optional)</Label>
                  <Input
                    id="farmName"
                    value={farmData.farmName}
                    onChange={(e) => setFarmData(prev => ({ ...prev, farmName: e.target.value }))}
                    placeholder="Johnson Family Farm"
                  />
                </div>
                <div>
                  <Label htmlFor="farmSize">Total Farm Size (acres)</Label>
                  <Input
                    id="farmSize"
                    type="number"
                    value={farmData.farmSize}
                    onChange={(e) => setFarmData(prev => ({ ...prev, farmSize: e.target.value }))}
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="primaryLivestock">Primary Livestock</Label>
                  <Select value={farmData.primaryLivestock} onValueChange={(value) => 
                    setFarmData(prev => ({ ...prev, primaryLivestock: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select livestock type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cattle">Cattle</SelectItem>
                      <SelectItem value="sheep">Sheep</SelectItem>
                      <SelectItem value="goats">Goats</SelectItem>
                      <SelectItem value="horses">Horses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="headCount">Current Head Count</Label>
                  <Input
                    id="headCount"
                    type="number"
                    value={farmData.currentHeadCount}
                    onChange={(e) => setFarmData(prev => ({ ...prev, currentHeadCount: e.target.value }))}
                    placeholder="25"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <Button 
                    onClick={getCurrentLocation}
                    className="w-full"
                    size="lg"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Current GPS Location
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    GPS provides the most accurate weather and growing conditions
                  </p>
                </div>
                
                <div className="text-center text-gray-400">— OR —</div>
                
                <div>
                  <Label htmlFor="zipcode">Enter Zipcode</Label>
                  <Input
                    id="zipcode"
                    value={farmData.location.zipcode}
                    onChange={(e) => setFarmData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, zipcode: e.target.value }
                    }))}
                    placeholder="74501"
                  />
                </div>

                {farmData.location.lat !== 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ GPS location captured for precise recommendations
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Livestock Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Why separate groups?</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Different animals have different water and feed needs. Separate lactating cows from dry cows, 
                        bulls from heifers, or sheep from cattle for more accurate recommendations.
                      </p>
                    </div>
                  </div>
                </div>

                {livestockGroups.map((group, index) => (
                  <Card key={group.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Group {index + 1}</CardTitle>
                        {livestockGroups.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLivestockGroup(group.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Group Name</Label>
                          <Input
                            value={group.name}
                            onChange={(e) => updateLivestockGroup(group.id, 'name', e.target.value)}
                            placeholder="e.g., Lactating Cows, Young Bulls"
                          />
                        </div>
                        <div>
                          <Label>Species</Label>
                          <Select 
                            value={group.species} 
                            onValueChange={(value) => {
                              updateLivestockGroup(group.id, 'species', value);
                              // Auto-fill weight if empty
                              if (!group.averageWeight) {
                                updateLivestockGroup(group.id, 'averageWeight', getSpeciesDefaults(value).weight);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select species" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cattle">Cattle</SelectItem>
                              <SelectItem value="sheep">Sheep</SelectItem>
                              <SelectItem value="goat">Goats</SelectItem>
                              <SelectItem value="horse">Horses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Breed (optional)</Label>
                          <Input
                            value={group.breed}
                            onChange={(e) => updateLivestockGroup(group.id, 'breed', e.target.value)}
                            placeholder="e.g., Angus, Dorper"
                          />
                        </div>
                        <div>
                          <Label>Number of Animals</Label>
                          <Input
                            type="number"
                            value={group.count}
                            onChange={(e) => updateLivestockGroup(group.id, 'count', e.target.value)}
                            placeholder="25"
                          />
                        </div>
                        <div>
                          <Label>Average Weight (lbs)</Label>
                          <Input
                            type="number"
                            value={group.averageWeight}
                            onChange={(e) => updateLivestockGroup(group.id, 'averageWeight', e.target.value)}
                            placeholder={group.species ? getSpeciesDefaults(group.species).weight : "1000"}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Age Group</Label>
                          <Select 
                            value={group.ageGroup} 
                            onValueChange={(value) => updateLivestockGroup(group.id, 'ageGroup', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select age group" />
                            </SelectTrigger>
                            <SelectContent>
                              {group.species && getSpeciesDefaults(group.species).ageOptions.map(age => (
                                <SelectItem key={age} value={age.toLowerCase()}>{age}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Sex</Label>
                          <Select 
                            value={group.sex} 
                            onValueChange={(value) => updateLivestockGroup(group.id, 'sex', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mixed">Mixed</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={group.lactating}
                            onCheckedChange={(checked) => updateLivestockGroup(group.id, 'lactating', checked)}
                          />
                          <Label>Some animals are lactating</Label>
                        </div>
                        
                        {group.lactating && (
                          <div>
                            <Label>Number lactating</Label>
                            <Input
                              type="number"
                              value={group.lactatingCount}
                              onChange={(e) => updateLivestockGroup(group.id, 'lactatingCount', e.target.value)}
                              placeholder={`${Math.floor(parseInt(group.count || "0") * 0.6)}`}
                            />
                          </div>
                        )}

                        <div>
                          <Label>Notes (optional)</Label>
                          <Input
                            value={group.notes}
                            onChange={(e) => updateLivestockGroup(group.id, 'notes', e.target.value)}
                            placeholder="Special needs or notes"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button 
                  variant="outline" 
                  onClick={addLivestockGroup}
                  className="w-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add Another Group
                </Button>

                <div className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <strong>Tip:</strong> You can create separate groups for different species, ages, or breeding status. 
                  For example: "Lactating Cows", "Dry Cows", "Young Bulls", "Sheep Flock".
                </div>
              </div>
            )}

            {/* Step 4: Paddocks */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <p className="text-sm text-gray-600">
                  Create 3 starter paddocks. You can add more later and adjust these anytime.
                </p>
                
                {paddockData.map((paddock, index) => (
                  <Card key={index} className="p-4">
                    <h4 className="font-medium mb-3">Paddock {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`paddock-name-${index}`}>Name</Label>
                        <Input
                          id={`paddock-name-${index}`}
                          value={paddock.name}
                          onChange={(e) => {
                            const newPaddocks = [...paddockData];
                            newPaddocks[index].name = e.target.value;
                            setPaddockData(newPaddocks);
                          }}
                          placeholder={`Paddock ${index + 1}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`paddock-acres-${index}`}>Acres</Label>
                        <Input
                          id={`paddock-acres-${index}`}
                          type="number"
                          step="0.1"
                          value={paddock.acres}
                          onChange={(e) => {
                            const newPaddocks = [...paddockData];
                            newPaddocks[index].acres = e.target.value;
                            setPaddockData(newPaddocks);
                          }}
                          placeholder="5.0"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Complete Setup</h3>
                  <p className="text-gray-600 mb-4">
                    Review your information and click finish to start managing your rotational grazing.
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Farm:</span>
                    <span className="font-medium">{farmData.farmName || "Unnamed Farm"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Livestock:</span>
                    <span className="font-medium">{farmData.currentHeadCount} {farmData.primaryLivestock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paddocks:</span>
                    <span className="font-medium">{paddockData.filter(p => p.name && p.acres).length} created</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-medium">
                      {farmData.location.lat !== 0 ? "GPS Enabled" : farmData.location.zipcode || "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={async () => {
                if (currentStep === 0 && wantsDemoMode) {
                  // Load demo data and skip to completion
                  const success = await loadDemoData();
                  if (success) {
                    setIsComplete(true);
                    onComplete();
                  }
                } else {
                  setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                }
              }}
              disabled={
                (currentStep === 0 && !wantsDemoMode && !farmData.primaryLivestock) ||
                (currentStep === 1 && !farmData.primaryLivestock) ||
                (currentStep === 2 && !farmData.location.zipcode && farmData.location.lat === 0) ||
                (currentStep === 3 && !livestockGroups.some(g => g.name && g.species && g.count)) ||
                isLoadingDemo
              }
            >
              {currentStep === 0 && wantsDemoMode 
                ? (isLoadingDemo ? "Loading Demo Data..." : "Start with Demo Data") 
                : "Next"
              }
              {!isLoadingDemo && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={createHerdMutation.isPending || createPaddockMutation.isPending}
            >
              {createHerdMutation.isPending || createPaddockMutation.isPending ? "Setting up..." : "Complete Setup"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}