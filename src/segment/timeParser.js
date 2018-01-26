import { range } from '../utils/list';
/**
 * Uses information provided by SegmentTemplate.SegmentTimeline to determine segment
 * timing and duration
 *
 * @param {number} start
 *        The start number for the first segment of this period
 * @param {number} timeline
 *        The timeline (period index) for the first segment of this period
 * @param {number} timescale
 *        The timescale for the timestamps contained within the media content
 * @param {Object[]} segmentTimeline
 *        List of objects representing the attributes of each S element contained within
 * @param {number} sourceDuration
 *        Duration of the entire Media Presentation
 * @return {{number: number, duration: number, time: number, timeline: number}[]}
 *         List of Objects with segment timing and duration info
 */
export const parseByTimeline =
(start, timeline, timescale, segmentTimeline, sourceDuration) => {
  const segments = [];
  let time = -1;

  for (let sIndex = 0; sIndex < segmentTimeline.length; sIndex++) {
    const S = segmentTimeline[sIndex];
    const duration = parseInt(S.d, 10);
    const repeat = parseInt(S.r || 0, 10);
    const segmentTime = parseInt(S.t || 0, 10);

    if (time < 0) {
      // first segment
      time = segmentTime;
    }

    if (segmentTime && segmentTime > time) {
      // discontinuity

      // TODO: How to handle this type of discontinuity
      // timeline++ here would treat it like HLS discontuity and content would
      // get appended without gap
      // E.G.
      //  <S t="0" d="1" />
      //  <S d="1" />
      //  <S d="1" />
      //  <S t="5" d="1" />
      // would have $Time$ values of [0, 1, 2, 5]
      // should this be appened at time positions [0, 1, 2, 3],(#EXT-X-DISCONTINUITY)
      // or [0, 1, 2, gap, gap, 5]? (#EXT-X-GAP)
      // does the value of sourceDuration consider this when calculating arbitrary
      // negative @r repeat value?
      // E.G. Same elements as above with this added at the end
      //  <S d="1" r="-1" />
      //  with a sourceDuration of 10
      // Would the 2 gaps be included in the time duration calculations resulting in
      // 8 segments with $Time$ values of [0, 1, 2, 5, 6, 7, 8, 9] or 10 segments
      // with $Time$ values of [0, 1, 2, 5, 6, 7, 8, 9, 10, 11] ?

      time = segmentTime;
    }

    let count;

    if (repeat < 0) {
      const nextS = sIndex + 1;

      if (nextS === segmentTimeline.length) {
        // last segment
        // TODO: This may be incorrect depending on conclusion of TODO above
        count = ((sourceDuration * timescale) - time) / duration;
      } else {
        count = (parseInt(segmentTimeline[nextS].t, 10) - time) / duration;
      }
    } else {
      count = repeat + 1;
    }

    const end = start + segments.length + count;
    let number = start + segments.length;

    while (number < end) {
      segments.push({ number, duration: duration / timescale, time, timeline });
      time += duration;
      number++;
    }
  }

  return segments;
};

export const parseByDuration = (start, timeline, timescale, duration, sourceDuration) => {
  const count = Math.ceil(sourceDuration / (duration / timescale));

  return range(start, start + count).map((number, index) => {
    const segment = { number, duration: duration / timescale, timeline };

    if (index === count - 1) {
      // final segment may be less than duration
      segment.duration = sourceDuration - (segment.duration * index);
    }

    segment.time = (segment.number - start) * duration;

    return segment;
  });
};
